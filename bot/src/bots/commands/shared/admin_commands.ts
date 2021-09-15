import { CommandHandler } from "../CommandHandler";
import { CommandHCGeneric, CommandCategories } from "../Command";
import { Permission } from "../CommandHandler";
import { CommandArguments } from "../Command";

const FILE_CATEGORY = CommandCategories.SHARED_ADMIN;

CommandHandler.queueDefaultCommand(
  new CommandHCGeneric<[string | undefined]>({
    permission: Permission.BROADCASTER,
    aliases: ["shutdown"],
    args: [{ arg: CommandArguments.STRING, name: "true", optional: true }],
    category: FILE_CATEGORY,
    callback: async (caller, channel, _alias, data, bot) => {
      const [confirm] = data;

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
