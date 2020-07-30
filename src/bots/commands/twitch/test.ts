import { twitchBot } from "../../../main";
import Command from "../Command";
import { HardCallback, CommandArguments } from "../Command";
import { Permission } from "../CommandHandler";

twitchBot.getCommandHandler()?.registerCommand(
  new Command<HardCallback>({
    permission: Permission.USER,
    aliases: ["test"],
    args: [
      { arg: CommandArguments.NUMBER, name: "num" },
      { arg: CommandArguments.STRING, name: "str", optional: true },
    ],
    callback: (caller, channel, alias, data) => {
      if (data)
        twitchBot.sendChannelMessage(`Test message: ${data[0]}, ${data[1]}`);
    },
  })
);
