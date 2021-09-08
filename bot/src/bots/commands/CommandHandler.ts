import IUser from "../IUser";
import winston from "winston";
import IBot from "../IBot";
import Command from "./Command";
import {
  HardCallback,
  StaticCallback,
  CommandArguments,
  CommandArgumentWrapper,
  SubCommandContainer,
} from "./Command";
import { combineArrays } from "../../utils";

export enum Permission {
  OWNER,
  BROADCASTER,
  MOD,
  VIP,
  SUBSCRIBER,
  FOLLOWER,
  USER,
}

interface ParserCallback {
  (original: string): any;
}

const defaultParser: ParserCallback = (original) => original;

interface MessageData {
  user: IUser;
  channel: string;
  msg: string;
}

type CommandData = MessageData & { alias: string };

export class RegisterError extends Error {}

export default class CommandHandler {
  // Aliases already registered as a command, statically or otherwise.
  private static reservedAliases: Set<string> = new Set();
  private static staticCommands: {
    [alias: string]: Command<StaticCallback>;
  } = {};
  private static defaultCommandQueue: Set<
    SubCommandContainer | Command<HardCallback>
  > = new Set();
  private static commandHandlers: Set<CommandHandler> = new Set();

  private commandPrefix: string = "!";
  private hardCommands: {
    [alias: string]: SubCommandContainer | Command<HardCallback>;
  } = {};
  private bot: IBot | null;
  private logger: winston.Logger;
  private parserMap: Map<CommandArguments, ParserCallback> = new Map();

  // Return True to cancel registration abortion
  protected onFailedRegister(_alias: string): boolean | void {}

  // Return True to halt message interpretation, ran before determining if message is a command
  protected onMessage(_data: MessageData): boolean | void {}

  // Return True to halt message interpretation, ran after determining message is not a command
  protected onNormalMessage(_data: MessageData): boolean | void {}

  // Return True to halt message interpretation, ran after determining message is a command
  protected onCommand(_data: CommandData): boolean | void {}

  protected onBadArguments({
    user,
    channel,
    alias: _alias,
    command,
  }: CommandData & { command: Command<HardCallback> }): void {
    const usage = this.getUsageMessage(command);
    if (usage && this.bot) this.bot.reply(user, usage, channel);
  }

  protected onInsufficientPermission(_data: CommandData): void {}

  constructor(logger: winston.Logger) {
    this.bot = null;
    this.logger = logger;

    CommandHandler.commandHandlers.add(this);

    this.parserMap.set(CommandArguments.NUMBER, (original) => {
      const result = parseFloat(original);
      if (isNaN(result)) throw new TypeError("Expected number, got NaN");

      return result;
    });
  }

  private hasPrefix(msg: string) {
    return msg.startsWith(this.commandPrefix);
  }

  public static getReservedAliases() {
    return this.reservedAliases.keys();
  }

  public static isReservedAlias(alias: string) {
    return CommandHandler.reservedAliases.has(alias);
  }

  public static addReserveredAlias(alias: string) {
    this.reservedAliases.add(alias);
  }

  public static deleteReserveredAlias(alias: string) {
    this.reservedAliases.delete(alias);
  }

  public static registerStaticCommand(aliases: string[], message: string) {
    aliases.forEach((alias) => {
      if (this.isReservedAlias(alias))
        throw new RegisterError("duplicate alias");
    });

    const command = new Command<StaticCallback>({
      permission: Permission.USER,
      aliases: aliases,
      callback: (bot: IBot, channel: string) => {
        bot.sendChannelMessage(message, channel);
      },
    });

    aliases.forEach((alias) => {
      CommandHandler.staticCommands[alias] = command;
      CommandHandler.addReserveredAlias(alias);
    });
  }

  public static deleteStaticCommand(
    commandOrAlias: Command<StaticCallback> | string
  ) {
    let command: Command<StaticCallback> | undefined;
    if (typeof commandOrAlias == "string") {
      command = CommandHandler.staticCommands[commandOrAlias];
    } else {
      command = commandOrAlias;
    }

    if (!command) throw new RegisterError("invalid alias");

    for (let alias in CommandHandler.staticCommands) {
      if (CommandHandler.staticCommands[alias] == command) {
        delete CommandHandler.staticCommands[alias];
        CommandHandler.deleteReserveredAlias(alias);
      }
    }
  }

  public static getStaticCommand(
    alias: string
  ): Command<StaticCallback> | undefined {
    return CommandHandler.staticCommands[alias];
  }

  public static queueDefaultCommand(
    command: SubCommandContainer | Command<HardCallback>
  ) {
    CommandHandler.defaultCommandQueue.add(command);
  }

  public static registerDefaultCommands() {
    CommandHandler.commandHandlers.forEach((handler) => {
      CommandHandler.defaultCommandQueue.forEach((cmd) => {
        handler.registerCommand(cmd);
      });
    });
  }

  public setBot(bot: IBot) {
    this.bot = bot;
  }

  public registerCommand(command: SubCommandContainer | Command<HardCallback>) {
    const aliases = command.getAliases();
    aliases.forEach((alias) => {
      if (this.hardCommands[alias]) {
        // Duplicate command hardcoded in bot
        if (!this.onFailedRegister(alias)) {
          return;
        }
      }
    });

    if (command instanceof Command) {
      const args = command.getArgs();
      let invalidArgs = false;
      if (args) {
        let shouldBeOptional = false;
        args.forEach((arg) => {
          if (shouldBeOptional && !arg.optional) {
            this.logger.error(
              `Invalid argument setup for '${aliases[0]}! Cannot have optional arguments before non-optional arguments'`
            );
            invalidArgs = true;
            this.onFailedRegister(aliases[0]);
            return;
          }

          shouldBeOptional = Boolean(arg.optional);
        });
      }
      if (invalidArgs) return;
    } else {
      if (command.getRegistered()) {
        this.onFailedRegister(aliases[0]);
        this.logger.error(
          `The command ${aliases[0]} is already registered and cannot be registered again...`
        );
        return;
      } else command.setRegistered(true);
    }

    command.getAliases().forEach((alias) => {
      // Add alias
      CommandHandler.addReserveredAlias(alias);

      // Store command
      this.hardCommands[alias] = command;
    });
  }

  public async handleMessage({ user, channel, msg }: MessageData) {
    if (this.onMessage({ user, channel, msg })) {
      this.logger.info(
        `onMessage - Canceling (${channel}, ${user.getUsername()}): ${msg}`
      );
      return;
    }

    let hardCommand: SubCommandContainer | Command<HardCallback> | undefined;
    let staticCommand: Command<StaticCallback> | undefined;
    let [alias, args] = this.parseMessage(msg);

    if (this.hasPrefix(msg)) {
      if ((hardCommand = this.hardCommands[alias])) {
        if (hardCommand instanceof Command) {
          await this.handleCommand({
            user,
            channel,
            msg,
            alias,
            args,
            command: hardCommand,
          });
        } else {
          this.handleSubCommandContainer({
            user,
            channel,
            msg,
            alias,
            args,
            command: hardCommand,
          });
        }
      } else if ((staticCommand = CommandHandler.getStaticCommand(alias))) {
        if (this.onCommand({ user, channel, alias, msg })) {
          this.logger.info(
            `onCommand - Canceling (${channel}, ${user.getUsername()}): ${msg}`
          );
          return;
        }

        if (this.bot) staticCommand.getCallback()(this.bot, channel);
      }
    } else {
      // Normal message

      // Not sure if I will add anything after this, but just in case...
      if (this.onNormalMessage({ user, channel, msg })) {
        this.logger.info(
          `onNormalMessage - Canceling (${channel}, ${user.getUsername()}): ${msg}`
        );
        return;
      }
    }
  }

  private async handleCommand({
    user,
    channel,
    alias,
    msg,
    command,
    args,
  }: CommandData & {
    command: Command<HardCallback>;
    args: string[];
  }) {
    if (this.onCommand({ user, channel, alias, msg })) {
      this.logger.info(
        `onCommand - Canceling (${channel}, ${user.getUsername()}): ${msg}`
      );
      return;
    }

    try {
      args = this.parseArguments(command, args);
    } catch (e) {
      if (e instanceof TypeError) {
        // A parser didn't like its input
        this.onBadArguments({
          user,
          channel,
          alias,
          msg,
          command,
        });
        return;
      } else {
        throw e;
      }
    }

    if (!this.hasPermission(user, command)) {
      this.onInsufficientPermission({
        user,
        channel,
        alias,
        msg,
      });
      this.logger.info(
        `onInsufficientPermission - Canceling (${channel}, ${user.getUsername()}): ${msg}`
      );
      return;
    }

    try {
      if (this.bot) command.getCallback()(user, channel, alias, args, this.bot);
    } catch (error) {
      if (process.env.NODE_ENV === "test") throw error;

      let str = `Caught error while running '${alias}: '`;
      if (error instanceof Error) {
        error.message = str + error.message;
        this.logger.error(error);
      } else this.logger.error(str);
    }
  }

  private handleSubCommandContainer({
    user,
    channel,
    alias,
    msg,
    command,
    args,
  }: CommandData & {
    command: SubCommandContainer;
    args: string[];
  }) {
    const subCommand = command.getCommands()[args[0]];
    if (!subCommand) {
      // No sub command found from arg
      return;
    }

    /*
      Since we found a sub command we need to handle it.
      If its another SubCommandContainer we will use recursion, 
      otherwise we will handle the hard command.
    */

    // Remove first arg since we used it to get here
    args = args.slice(1);
    if (subCommand instanceof Command)
      this.handleCommand({
        user,
        channel,
        alias,
        msg,
        args,
        command: subCommand,
      });
    else {
      this.handleSubCommandContainer({
        user,
        channel,
        alias,
        msg,
        args,
        command: subCommand,
      });
    }
  }

  public hasPermission(
    user: IUser,
    aliasOrCommand:
      | string
      | SubCommandContainer
      | Command<HardCallback>
      | undefined
  ) {
    if (typeof aliasOrCommand === "string") {
      aliasOrCommand = this.hardCommands[aliasOrCommand];
    }

    return (
      aliasOrCommand instanceof Command &&
      aliasOrCommand.getPermission() >= user.getPermission()
    );
  }

  public registerParser(arg: CommandArguments, callback: ParserCallback) {
    this.parserMap.set(arg, callback);
  }

  private parseMessage(msg: string): [string, string[]] {
    // Parse command and its arguments entered by user
    const args = (msg.match(/(?:[^\s"]+|"[^"]*")+/g) || []).map((arg) =>
      arg.startsWith('"') && arg.endsWith('"')
        ? arg.substring(1, arg.length - 1)
        : arg
    );
    // Remove command from args
    const alias = args.splice(0, 1)[0].substring(this.commandPrefix.length);

    return [alias, args];
  }

  private parseArguments(command: Command<HardCallback>, args: string[]) {
    const commandArgs = command.getArgs();
    if (!commandArgs) return;

    args = this.handleLastStringArgument(commandArgs, args);

    const combined = combineArrays<CommandArgumentWrapper, string>(
      commandArgs,
      args
    );
    const parsed: any = [];

    combined.forEach(({ left, right }) => {
      // If we have a parser, grab it. Otherwise use the defaultParser
      const parser = (left && this.parserMap.get(left.arg)) || defaultParser;
      if (left) {
        if (!right) {
          // Empty value for argument

          // Prioceed if optional argument, throw error otherwise
          if (left.optional) parsed.push(null);
          else throw new TypeError("No value for required argument");
        } else parsed.push(parser(right));
      }
    });

    return parsed;
  }

  private handleLastStringArgument(
    commandArgs: CommandArgumentWrapper[],
    args: string[]
  ) {
    if (
      commandArgs[commandArgs.length - 1].arg == CommandArguments.STRING &&
      args.length > commandArgs.length
    ) {
      /* Last arg is a string and we recieved more arguments than expected,
        then all arguments in args past the length commandArgs must be part of that string
        Ex:
        [int, int, string]
        [1,   1,   hello, there] => [1, 1, hello there]
      */

      // Remove args that are apart of the single string arg, combine it, and insert it back into array
      args.push(args.splice(commandArgs.length - 1).join(" "));
    }

    return args;
  }

  public getBot() {
    return this.bot;
  }

  protected getArgTypeAsString(arg: CommandArguments): string {
    switch (arg) {
      case CommandArguments.NUMBER:
        return "num";
      case CommandArguments.STRING:
        return "str";
      case CommandArguments.USER:
        return "user";
    }
  }

  public getUsageMessage(aliasOrCommand: string | Command<HardCallback>) {
    let command;

    if (aliasOrCommand instanceof Command) command = aliasOrCommand;
    else command = this.hardCommands[aliasOrCommand];

    if (command instanceof Command) {
      let str = "Args: ";
      command.getArgs()?.forEach((cmd) => {
        const argStr = `${cmd.name}: ${this.getArgTypeAsString(cmd.arg)}`;
        if (cmd.optional) str += `[${argStr}] `;
        else str += `<${argStr}> `;
      });

      return str;
    }
  }
}
