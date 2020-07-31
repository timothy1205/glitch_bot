import { SubCommandContainer, CommandArguments } from "../Command";
import Command from "../Command";
import CommandHandler, { Permission } from "../CommandHandler";

// TODO: Implement registering and remove of static command,
// integrated with mongodb
CommandHandler.queueDefaultCommand(
  new SubCommandContainer(["command", "cmd"])
    .addCommand(
      new Command({
        permission: Permission.MOD,
        aliases: ["add"],
        args: [
          { arg: CommandArguments.STRING, name: "cmd" },
          { arg: CommandArguments.STRING, name: "msg" },
        ],
        callback: (caller, channel, alias, data, bot) => {},
      })
    )
    .addCommand(
      new Command({
        permission: Permission.MOD,
        aliases: ["remove", "rm"],
        args: [{ arg: CommandArguments.STRING, name: "cmd" }],
        callback: (caller, channel, alias, data, bot) => {},
      })
    )
);
