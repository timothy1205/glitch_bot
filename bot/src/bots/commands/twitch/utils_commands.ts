import Command from "../Command";
import { CommandArguments, SubCommandContainer } from "../Command";
import { Permission } from "../CommandHandler";
import { twitchAPI, getFollowsByName } from "../../../twitch_api";
import twitchBot from "../../TwitchBot";
import {
  getUser,
  setStatBanned,
  getStatBanned,
} from "../../../mongo/models/UserModel";
import { formatWatchTime, millisecondsToMinutes } from "../../../utils";

twitchBot.getCommandHandler()?.registerCommand(
  new Command({
    permission: Permission.USER,
    aliases: ["followage", "fa"],
    args: [{ arg: CommandArguments.USER, name: "user", optional: true }],
    callback: async (caller, _channel, _alias, data, _bot) => {
      const [user] = data as [string | undefined];

      const followUser = user
        ? await getFollowsByName(user)
        : await getFollowsByName(caller.getUsername());

      if (followUser) {
        const followDate = new Date(followUser.followDate);
        const month = followDate.getMonth() + 1;
        const day = followDate.getDate();
        const year = followDate.getFullYear();

        const now = new Date();
        const daysAgo = Math.round(
          (now.getTime() - followDate.getTime()) / 86400000 // Day in ms
        );

        twitchBot.reply(
          caller,
          `${
            user ? `${user} has` : "you've"
          } been a follower since ${month}/${day}/${year} (${daysAgo} day${
            daysAgo === 1 ? "" : "s"
          } ago).`
        );
      } else {
        twitchBot.reply(
          caller,
          `${user ? `${user} is` : "you are"} not a follower...`
        );
      }
    },
  })
);

twitchBot.getCommandHandler()?.registerCommand(
  new Command({
    permission: Permission.USER,
    aliases: ["uptime", "up"],
    callback: async (caller, _channel, _alias, _data, _bot) => {
      if (!process.env.TWITCH_WORKING_CHANNEL) return;

      const helixStream = await twitchAPI.helix.streams.getStreamByUserName(
        process.env.TWITCH_WORKING_CHANNEL
      );
      if (helixStream) {
        twitchBot.reply(
          caller,
          `the stream has been up for ${formatWatchTime(
            millisecondsToMinutes(Date.now() - helixStream.startDate.getTime())
          )}`
        );
      } else {
        twitchBot.reply(caller, "the stream is offline...");
      }
    },
  })
);
twitchBot.getCommandHandler()?.registerCommand(
  new Command({
    permission: Permission.USER,
    aliases: ["watchtime", "wt"],
    args: [{ arg: CommandArguments.USER, name: "user", optional: true }],
    callback: async (caller, _channel, _alias, data, _bot) => {
      const [user] = data as [string | undefined];
      let mongoUser;

      if (user) {
        const helixUser = await twitchAPI.helix.users.getUserByName(user);
        if (helixUser) mongoUser = await getUser({ twitchId: helixUser.id });
      } else {
        const id = caller.getID();
        if (id) mongoUser = await getUser({ twitchId: id });
      }

      if (mongoUser && mongoUser.minutesWatched) {
        twitchBot.reply(
          caller,
          `${user ? `${user} has` : "you've"} watched for ${formatWatchTime(
            mongoUser.minutesWatched
          )}`
        );
      } else {
        twitchBot.reply(caller, "could not find any watch time!");
      }
    },
  })
);

twitchBot.getCommandHandler()?.registerCommand(
  new SubCommandContainer(["stat", "statistic"])
    .addCommand(
      new Command({
        permission: Permission.BROADCASTER,
        aliases: ["ban"],
        args: [{ arg: CommandArguments.USER, name: "user" }],
        callback: async (caller, _channel, _alias, data, _bot) => {
          const [user] = data as [string];

          const helixUser = await twitchAPI.helix.users.getUserByName(user);
          if (helixUser) {
            setStatBanned(helixUser.id, true);
            twitchBot.reply(
              caller,
              `${user} is now banned from gaining points/watch time`
            );
          } else twitchBot.reply(caller, "user not found!");
        },
      })
    )
    .addCommand(
      new Command({
        permission: Permission.BROADCASTER,
        aliases: ["unban"],
        args: [{ arg: CommandArguments.USER, name: "user" }],
        callback: async (caller, _channel, _alias, data, _bot) => {
          const [user] = data as [string];

          const helixUser = await twitchAPI.helix.users.getUserByName(user);
          if (helixUser) {
            setStatBanned(helixUser.id, false);
            twitchBot.reply(
              caller,
              `${helixUser.displayName} is no longer banned from gaining points/watch time`
            );
          } else twitchBot.reply(caller, "user not found!");
        },
      })
    )
    .addCommand(
      new Command({
        permission: Permission.MOD,
        aliases: ["check"],
        args: [{ arg: CommandArguments.USER, name: "user" }],
        callback: async (caller, _channel, _alias, data, _bot) => {
          const [user] = data as [string];

          const helixUser = await twitchAPI.helix.users.getUserByName(user);
          const banned =
            helixUser && (await getStatBanned({ twitchId: helixUser.id }));
          twitchBot.reply(
            caller,
            `${helixUser?.displayName || user} ${
              banned ? "is" : "is not"
            } banned`
          );
        },
      })
    )
);

twitchBot.getCommandHandler()?.registerCommand(
  new Command({
    permission: Permission.MOD,
    aliases: ["shoutout", "so"],
    args: [{ arg: CommandArguments.STRING, name: "user" }],
    callback: async (_caller, _channel, _alias, data, _bot) => {
      const [user] = data as [string];

      twitchBot.sendChannelMessage(
        `Go checkout ${user}'s channel at https://twitch.tv/${user}`
      );
    },
  })
);
