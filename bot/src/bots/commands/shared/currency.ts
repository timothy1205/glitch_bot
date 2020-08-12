import CommandHandler from "../CommandHandler";
import Command from "../Command";
import { Permission } from "../CommandHandler";
import { CommandArguments } from "../Command";
import TwitchUser from "../../TwitchUser";
import { getPoints, addPoints, getTopPoints } from "../../../mongo/user";
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
        if (user && user.startsWith("@")) {
          const name = user.substr(1);
          const helixUser = await twitchAPI.helix.users.getUserByName(name);
          if (
            helixUser &&
            (points = await getPoints({ twitchId: helixUser.id }))
          ) {
            bot.reply(
              caller,
              `${helixUser.displayName} has ${formatPoints(points)}`
            );
          } else {
            bot.reply(caller, `no points found for ${name}`);
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
            `no balance found. I'll start you off with ${formatPoints(rand)}`
          );
        } else bot.reply(caller, `no balance found!`);
      } else bot.reply(caller, `you have ${formatPoints(points)}`);
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
