import assert from "assert";
import {
  getStatBanned,
  getUser,
  setStatBanned,
} from "../../../mongo/models/UserModel";
import { getFollowsByName, twitchAPI } from "../../../twitch_api";
import { formatWatchTime, millisecondsToMinutes } from "../../../utils";
import { twitchBot } from "../../TwitchBot";
import {
  CommandHCGeneric,
  CommandArguments,
  SubCommandContainer,
} from "../Command";
import { Permission } from "../CommandHandler";

const DAY_MILLISECONDS = 86400000;

twitchBot.getCommandHandler()?.registerCommand(
  new CommandHCGeneric<[string | undefined]>({
    permission: Permission.USER,
    aliases: ["followage", "fa"],
    args: [{ arg: CommandArguments.USER, name: "user", optional: true }],
    callback: async (caller, _channel, _alias, data, _bot) => {
      const [user] = data;

      const followUser = user
        ? await getFollowsByName(user)
        : await getFollowsByName(caller.getUsername());

      if (followUser) {
        const followDate = new Date(followUser.followDate);
        const followDateISO = followDate.toISOString().replace(/T[\s\S]+/g, "");

        const now = new Date();
        const daysAgo = Math.round(
          (now.getTime() - followDate.getTime()) / DAY_MILLISECONDS
        );

        twitchBot.reply(
          caller,
          `${
            user ? `${user} has` : "you've"
          } been a follower since ${followDateISO} (${daysAgo} day${
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
  new CommandHCGeneric<[]>({
    permission: Permission.USER,
    aliases: ["uptime", "up"],
    callback: async (caller, _channel, _alias, _data, _bot) => {
      assert.ok(process.env.TWITCH_WORKING_CHANNEL);

      const helixStream = await twitchAPI.streams.getStreamByUserName(
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
  new CommandHCGeneric<[string | undefined]>({
    permission: Permission.USER,
    aliases: ["watchtime", "wt"],
    args: [{ arg: CommandArguments.USER, name: "user", optional: true }],
    callback: async (caller, _channel, _alias, data, _bot) => {
      const [user] = data;
      let mongoUser;

      if (user) {
        const helixUser = await twitchAPI.users.getUserByName(user);
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
      new CommandHCGeneric<[string]>({
        permission: Permission.BROADCASTER,
        aliases: ["ban"],
        args: [{ arg: CommandArguments.USER, name: "user" }],
        callback: async (caller, _channel, _alias, data, _bot) => {
          const [user] = data;

          const helixUser = await twitchAPI.users.getUserByName(user);
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
      new CommandHCGeneric<[string]>({
        permission: Permission.BROADCASTER,
        aliases: ["unban"],
        args: [{ arg: CommandArguments.USER, name: "user" }],
        callback: async (caller, _channel, _alias, data, _bot) => {
          const [user] = data;

          const helixUser = await twitchAPI.users.getUserByName(user);
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
      new CommandHCGeneric<[string]>({
        permission: Permission.MOD,
        aliases: ["check"],
        args: [{ arg: CommandArguments.USER, name: "user" }],
        callback: async (caller, _channel, _alias, data, _bot) => {
          const [user] = data;

          const helixUser = await twitchAPI.users.getUserByName(user);
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
  new CommandHCGeneric<[string]>({
    permission: Permission.MOD,
    aliases: ["shoutout", "so"],
    args: [{ arg: CommandArguments.STRING, name: "user" }],
    callback: async (_caller, _channel, _alias, data, _bot) => {
      const [user] = data;

      twitchBot.sendChannelMessage(
        `Go checkout ${user}'s channel at https://twitch.tv/${user}`
      );
    },
  })
);

twitchBot.getCommandHandler()?.registerCommand(
  new CommandHCGeneric<[string]>({
    permission: Permission.MOD,
    aliases: ["follows"],
    args: [{ arg: CommandArguments.STRING, name: "status" }],
    callback: async (caller, _channel, _alias, data, bot) => {
      const [status] = data;

      switch (status) {
        case "on":
          (bot as typeof twitchBot).useFollowNotifications = true;
          break;
        case "off":
          (bot as typeof twitchBot).useFollowNotifications = false;
          break;
        default:
          twitchBot.reply(caller, 'valid options are "on" and "off"');
          return;
      }

      twitchBot.reply(caller, `follow notifications are now: ${status}`);
    },
  })
);
