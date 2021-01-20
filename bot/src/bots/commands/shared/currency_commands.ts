import CommandHandler from "../CommandHandler";
import Command from "../Command";
import { Permission } from "../CommandHandler";
import { CommandArguments, SubCommandContainer } from "../Command";
import TwitchUser from "../../TwitchUser";
import {
  getPoints,
  addPoints,
  getTopPoints,
  setPoints,
  InvalidPointsError,
  resetAllPoints,
} from "../../../mongo/models/UserModel";
import { formatPoints } from "../../../utils";
import { twitchAPI } from "../../../twitch_api";

CommandHandler.queueDefaultCommand(
  new Command({
    permission: Permission.USER,
    aliases: ["bal", "balance"],
    args: [{ arg: CommandArguments.USER, name: "user", optional: true }],
    callback: async (caller, channel, _alias, data, bot) => {
      const [user] = data as [string | undefined];
      const id = caller.getID();
      if (!id) return;

      let points: number | undefined;
      if (caller instanceof TwitchUser) {
        if (user) {
          const helixUser = await twitchAPI.helix.users.getUserByName(user);
          if (
            helixUser &&
            (points = await getPoints({ twitchId: helixUser.id })) !== undefined
          ) {
            bot.reply(
              caller,
              `${helixUser.displayName} has ${formatPoints(points)}`,
              channel
            );
          } else {
            bot.reply(caller, `no points found for ${user}`, channel);
          }
          return;
        }

        points = await getPoints({ twitchId: id });
      }
      // TODO: Setup after making DiscordUser stuff
      // else if (caller instanceof DiscordUser) points = getPoints({ discordId: id});
      else return;

      if (points === undefined) {
        if (caller instanceof TwitchUser) {
          const rand = Math.round(Math.random() * 100);
          addPoints({ twitchId: id }, rand);
          bot.reply(
            caller,
            `no balance found. I'll start you off with ${formatPoints(rand)},`,
            channel
          );
        } else bot.reply(caller, `no balance found!`);
      } else bot.reply(caller, `you have ${formatPoints(points)}`, channel);
    },
  })
);

CommandHandler.queueDefaultCommand(
  new Command({
    permission: Permission.USER,
    aliases: ["baltop", "balancetop"],
    callback: async (caller, channel, _alias, data, bot) => {
      let response = `Top 5 Viewers: `;
      const users = await getTopPoints();
      const twitchIds = users.map((user) => user.twitchId);
      const twitchNames = await (
        await twitchAPI.helix.users.getUsersByIds(twitchIds)
      ).map((helixUser) => helixUser.displayName);

      twitchNames.forEach((name, index) => {
        response += `${name} [${users[index].points || 0}]${
          index !== twitchNames.length - 1 ? ", " : ""
        }`;
      });

      bot.reply(caller, response, channel);
    },
  })
);

// TODO: Mod commands

let confirmKey: string | undefined;
let timeout: NodeJS.Timeout | undefined;
CommandHandler.queueDefaultCommand(
  new SubCommandContainer(["points"])
    .addCommand(
      new Command({
        permission: Permission.MOD,
        aliases: ["set"],
        args: [
          { arg: CommandArguments.USER, name: "user" },
          { arg: CommandArguments.NUMBER, name: "points" },
        ],
        callback: async (caller, channel, _alias, data, bot) => {
          const [user, points] = data as [string, number];
          if (points < 0) return bot.reply(caller, "no negative numbers!");

          if (caller instanceof TwitchUser) {
            const helixUser = await twitchAPI.helix.users.getUserByName(user);
            if (helixUser) {
              await setPoints({ twitchId: helixUser.id }, points);
              bot.reply(
                caller,
                `${helixUser.displayName} now has ${formatPoints(points)}`,
                channel
              );
            } else {
              bot.reply(caller, `${user} is not in the database!`, channel);
            }
            return;
          }
        },
      })
    )
    .addCommand(
      new Command({
        permission: Permission.MOD,
        aliases: ["add"],
        args: [
          { arg: CommandArguments.USER, name: "user" },
          { arg: CommandArguments.NUMBER, name: "points" },
        ],
        callback: async (caller, channel, _alias, data, bot) => {
          const [user, points] = data as [string, number];
          try {
            if (caller instanceof TwitchUser) {
              const helixUser = await twitchAPI.helix.users.getUserByName(user);
              if (helixUser) {
                const updatedPoints = await addPoints(
                  { twitchId: helixUser.id },
                  points
                );
                bot.reply(
                  caller,
                  `${helixUser.displayName} now has ${formatPoints(
                    updatedPoints
                  )}`,
                  channel
                );
              } else {
                bot.reply(caller, `${user} is not in the database!`, channel);
              }
              return;
            }
          } catch (error) {
            if (error instanceof InvalidPointsError)
              return bot.reply(caller, "no negative numbers!", channel);
            throw error;
          }
        },
      })
    )
    .addCommand(
      new Command({
        permission: Permission.BROADCASTER,
        aliases: ["reset"],
        args: [{ arg: CommandArguments.STRING, name: "key", optional: true }],
        callback: async (caller, channel, _alias, data, bot) => {
          const [inputKey] = data as [string | undefined];

          if (confirmKey && inputKey && inputKey === confirmKey) {
            await resetAllPoints();
            bot.reply(caller, `all points have been reset!`, channel);
          } else {
            confirmKey = Math.random().toString(36).substring(8);

            if (timeout) {
              clearTimeout(timeout);
            }

            timeout = setTimeout(() => {
              confirmKey = undefined;
              timeout = undefined;
            }, 10000);
            bot.reply(
              caller,
              `confirm by repeating the command followed by "${confirmKey}" within 10 seconds.`,
              channel
            );
          }
        },
      })
    )
);
