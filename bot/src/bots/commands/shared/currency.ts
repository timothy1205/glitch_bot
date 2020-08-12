import CommandHandler from "../CommandHandler";
import Command from "../Command";
import { Permission } from "../CommandHandler";
import { CommandArguments } from "../Command";
import TwitchUser from "../../TwitchUser";
import { getPoints, addPoints } from "../../../mongo/user";
import { formatPoints } from "../../../utils";

CommandHandler.queueDefaultCommand(
  new Command({
    permission: Permission.USER,
    aliases: ["bal", "balance"],
    args: [{ arg: CommandArguments.USER, name: "user", optional: true }],
    callback: async (caller, channel, _alias, data, bot) => {
      const id = caller.getID();
      if (!id) return;

      let points: number | undefined;
      if (caller instanceof TwitchUser)
        points = await getPoints({ twitchId: id });
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

// TODO: Mod commands
