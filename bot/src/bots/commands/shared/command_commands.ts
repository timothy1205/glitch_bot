import { SubCommandContainer, CommandArguments } from "../Command";
import Command from "../Command";
import CommandHandler, { Permission } from "../CommandHandler";
import { RegisterError } from "../CommandHandler";
import {
  setMongoStaticCommand,
  deleteMongoStaticCommand,
} from "../../../mongo/staticCommands";

CommandHandler.queueDefaultCommand(
  new SubCommandContainer(["command", "cmd"])
    .addCommand(
      new Command({
        permission: Permission.MOD,
        aliases: ["add"],
        args: [
          { arg: CommandArguments.STRING, name: "alias(es)" },
          { arg: CommandArguments.STRING, name: "msg" },
        ],
        callback: async (caller, channel, _alias, data, bot) => {
          const [aliases, message] = data as [string, string];

          const aliasArr = aliases.split(",");
          aliasArr.map((str) => str.replace(/ /g, ""));

          try {
            CommandHandler.registerStaticCommand(aliasArr, message);
            await setMongoStaticCommand(aliasArr, message);
            bot.reply(caller, "successfully registered command!");
          } catch (error) {
            if (error instanceof RegisterError) {
              bot.reply(caller, "failed to register command!", channel);
            } else {
              throw error;
            }
          }
        },
      })
    )
    .addCommand(
      new Command({
        permission: Permission.MOD,
        aliases: ["remove", "rm"],
        args: [{ arg: CommandArguments.STRING, name: "alias" }],
        callback: async (caller, channel, _alias, data, bot) => {
          const [alias] = data as [string];

          try {
            CommandHandler.deleteStaticCommand(alias);
            await deleteMongoStaticCommand(alias);
            bot.reply(caller, "successfully removed command!");
          } catch (error) {
            if (error instanceof RegisterError) {
              bot.reply(
                caller,
                "failed to delete command, does it exist?",
                channel
              );
            } else {
              throw error;
            }
          }
        },
      })
    )
);
