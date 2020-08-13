import CommandHandler from "../CommandHandler";
import Command from "../Command";
import { Permission } from "../CommandHandler";
import { CommandArguments } from "../Command";

CommandHandler.queueDefaultCommand(
  new Command({
    permission: Permission.BROADCASTER,
    aliases: ["shutdown"],
    args: [{ arg: CommandArguments.STRING, name: "true", optional: true }],
    callback: async (caller, channel, _alias, data, bot) => {
      const [confirm] = data as [string | undefined];

      if (!confirm || confirm !== "true") {
        bot.reply(
          caller,
          'are you sure you want me to kill myself? Use the command again with the argument "true" to confirm...',
          channel
        );
        return;
      } else {
        bot.reply(caller, ":(", channel);
        process.exit();
      }
    },
  })
);
