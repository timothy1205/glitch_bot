import { twitchBot } from "../../../main";
import Command from "../Command";
import {
  HardCallback,
  CommandArguments,
  SubCommandContainer,
} from "../Command";
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
      twitchBot.sendChannelMessage(`Test message: ${data[0]}, ${data[1]}`);
    },
  })
);

twitchBot.getCommandHandler()?.registerCommand(
  new SubCommandContainer(["first"])
    .addCommand(
      new SubCommandContainer(["second"]).addCommand(
        new Command({
          permission: Permission.USER,
          aliases: ["third"],
          callback: () => {
            twitchBot.sendChannelMessage("Succeeded");
          },
        })
      )
    )
    .addCommand(
      new SubCommandContainer(["alt"]).addCommand(
        new Command({
          permission: Permission.USER,
          aliases: ["alt2"],
          args: [
            { arg: CommandArguments.NUMBER, name: "num" },
            { arg: CommandArguments.STRING, name: "str", optional: true },
          ],
          callback: (caller, channel, alias, data) => {
            twitchBot.sendChannelMessage(`Succeeded 2: ${data[0]}, ${data[1]}`);
          },
        })
      )
    )
);
