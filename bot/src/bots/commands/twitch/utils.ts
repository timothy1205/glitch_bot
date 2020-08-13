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

      const axiosResponse = await axios.get(
        `https://beta.decapi.me/twitch/uptime/${process.env.TWITCH_WORKING_CHANNEL}`
      );
      const msg =
        `${axiosResponse.data}`.toLowerCase() ===
        `${process.env.TWITCH_WORKING_CHANNEL} is offline`
          ? "the stream is offline"
          : `the stream has been up for ${axiosResponse.data}.`;
      twitchBot.reply(caller, msg);
    },
  })
);
