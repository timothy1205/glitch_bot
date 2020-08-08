import CommandHandler from "../CommandHandler";
import Command from "../Command";
import { Permission } from "../CommandHandler";
import { CommandArguments } from "../Command";
import TwitchUser from "../../TwitchUser";
import { getPoints } from "../../../mongo/user";
import { formatPoints } from "../../../utils";

CommandHandler.queueDefaultCommand(
  new Command({
    permission: Permission.USER,
    aliases: ["bal", "balance"],
    args: [{ arg: CommandArguments.USER, name: "user", optional: true }],
    callback: async (caller, channel, _alias, data, bot) => {
      const id = caller.getID();
      if (!id) return;

      let points: number | null | undefined;
      if (caller instanceof TwitchUser)
        points = await getPoints({ twitchId: id });
      // TODO: Setup after making DiscordUser stuff
      // else if (caller instanceof DiscordUser) points = getPoints({ discordId: id});
      else return;

      if (typeof points === "number")
        bot.reply(caller, `you have ${formatPoints(points)}`);
    },
  })
);

// TODO: Mod commands
