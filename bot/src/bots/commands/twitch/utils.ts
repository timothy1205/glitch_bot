import axios from "axios";
import twitchCommandHandler from "../TwitchCommandHandler";
import Command from "../Command";
import { CommandArguments } from "../Command";
import { Permission } from "../CommandHandler";
import {
  twitchAPI,
  getFollowsByName,
  getFollowsByID,
} from "../../../twitch_api";
import twitchBot from "../../TwitchBot";
import { getUser } from "../../../mongo/models/UserModel";
import { formatWatchTime, millisecondsToMinutes } from "../../../utils";

twitchCommandHandler.registerCommand(
  new Command({
    permission: Permission.USER,
    aliases: ["followage", "fa"],
    args: [{ arg: CommandArguments.USER, name: "user", optional: true }],
    callback: async (caller, _channel, _alias, data, _bot) => {
      const [user] = data as [string | undefined];
      const twitchId = caller.getID();
      if (!twitchId) return;

      const followUser = user
        ? await getFollowsByName(user)
        : await getFollowsByID(twitchId);

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

twitchCommandHandler.registerCommand(
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

twitchCommandHandler.registerCommand(
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
