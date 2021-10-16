import { addAutoMessage, removeAutoMessage } from "./../../../auto_messages";
import {
  getMongoStaticCommand,
  getMongoStaticCommands,
} from "./../../../mongo/staticCommands";
import {
  CommandArguments,
  CommandCategories,
  CommandHCGeneric,
  SubCommandContainer,
} from "../Command";
import { CommandHandler, Permission } from "../CommandHandler";
import { RegisterError } from "../CommandHandler";
import {
  setMongoStaticCommand,
  deleteMongoStaticCommand,
} from "../../../mongo/staticCommands";

const FILE_CATEGORY = CommandCategories.SHARED_CMD;

CommandHandler.queueDefaultCommand(
  new SubCommandContainer(["command", "cmd"])
    .addCommand(
      new CommandHCGeneric<[string, string]>({
        permission: Permission.MOD,
        aliases: ["add"],
        args: [
          { arg: CommandArguments.STRING, name: "alias(es)" },
          { arg: CommandArguments.STRING, name: "msg" },
        ],
        category: FILE_CATEGORY,
        callback: async (caller, channel, _alias, data, bot) => {
          const [aliases, message] = data;

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
      new CommandHCGeneric<[string]>({
        permission: Permission.MOD,
        aliases: ["remove", "rm"],
        args: [{ arg: CommandArguments.STRING, name: "alias" }],
        category: FILE_CATEGORY,
        callback: async (caller, channel, _alias, data, bot) => {
          const [alias] = data;

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
    .addCommand(
      new CommandHCGeneric<[string, string | undefined]>({
        permission: Permission.MOD,
        aliases: ["auto"],
        args: [
          { arg: CommandArguments.STRING, name: "alias" },
          {
            arg: CommandArguments.STRING,
            name: "state [on/off]",
            optional: true,
          },
        ],
        category: FILE_CATEGORY,
        callback: async (caller, _channel, _alias, data, bot) => {
          const [alias, inputState] = data;

          const staticCommand = CommandHandler.getStaticCommand(alias);
          const mongoStaticCommand = await getMongoStaticCommand(alias);

          if (staticCommand && mongoStaticCommand) {
            const state = inputState
              ? inputState === "on"
                ? true
                : false
              : !mongoStaticCommand.auto;

            mongoStaticCommand.auto = state;
            await mongoStaticCommand.save();

            if (state) {
              addAutoMessage(mongoStaticCommand.message);
            } else {
              removeAutoMessage(mongoStaticCommand.message);
            }

            bot.reply(
              caller,
              `command will ${
                state ? "now" : "no longer"
              } be sent automatically!`
            );
          } else {
            bot.reply(caller, "invalid command!");
          }
        },
      })
    )
    .addCommand(
      new CommandHCGeneric<[string]>({
        permission: Permission.MOD,
        aliases: ["check"],
        args: [{ arg: CommandArguments.STRING, name: "alias" }],
        category: FILE_CATEGORY,
        callback: async (caller, _channel, _alias, data, bot) => {
          const [alias] = data;

          const mongoStaticCommand = await getMongoStaticCommand(alias);

          if (mongoStaticCommand) {
            bot.reply(
              caller,
              `command will ${
                mongoStaticCommand.auto ? "" : "not"
              } be sent automatically!`
            );
          } else {
            bot.reply(caller, "invalid command!");
          }
        },
      })
    )
    .addCommand(
      new CommandHCGeneric({
        permission: Permission.USER,
        aliases: ["list"],
        category: FILE_CATEGORY,
        callback: async (caller, _channel, _alias, _data, bot) => {
          const mongoStaticCommands = await getMongoStaticCommands();
          let commandString = "";

          mongoStaticCommands.forEach((staticCommand) => {
            commandString += `{[${staticCommand.aliases.join(",")}]: auto => ${
              staticCommand.auto
            }}, `;
          });

          commandString = commandString.slice(0, -1); // Remove last comma

          bot.reply(caller, "Static Commands: " + commandString);
        },
      })
    )
);
