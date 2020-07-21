import { twitchBot } from "../../../main";
import Command from "../Command";
import { HardCallback } from "../Command";
import { Permission } from "../CommandHandler";

twitchBot.getCommandHandler()?.registerCommand(
  new Command<HardCallback>({
    permission: Permission.USER,
    aliases: ["test"],
    callback: (caller, channel) => {
      twitchBot.sendChannelMessage("Test message", channel);
    },
  })
);
