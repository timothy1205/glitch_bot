import User from "../User";
import winston from "winston";
import IBot from "../IBot";
import Command from "./Command";
import {
  HardCallback,
  StaticCallback,
  CommandArguments,
  CommandArgumentWrapper,
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

export default class CommandHandler {
  // Aliases already registered as a command, statically or otherwise.
  // TODO: Replace staticMap and commandMap with a dictionary
  private static reservedAliases: Set<string> = new Set();
  private static staticMap: Map<string, Command<StaticCallback>> = new Map();

  private commandPrefix: string = "!";
  private commandMap: Map<string, Command<HardCallback>> = new Map();
  private bot: IBot;
  private logger: winston.Logger;
  private parserMap: Map<CommandArguments, ParserCallback> = new Map();

  // Return True to cancel registration abortion
  protected onFailedRegister(alias: string): boolean | void {}

  // Return True to halt message interpretation, ran before determining if message is a command
  protected onMessage(
    user: User,
    channel: string,
    msg: string
  ): boolean | void {}

  // Return True to halt message interpretation, ran after determining message is not a command
  protected onNormalMessage(
    user: User,
    channel: string,
    msg: string
  ): boolean | void {}

  // Return True to halt message interpretation, ran after determining message is a command
  protected onCommand(
    user: User,
    channel: string,
    alias: string,
    msg: string
  ): boolean | void {}

  protected onBadArguments(
    user: User,
    channel: string,
    alias: string,
    msg: string
  ): void {}

  protected onInsufficientPermission(
    user: User,
    channel: string,
    alias: string,
    msg: string
  ): void {}

  constructor(bot: IBot, logger: winston.Logger) {
    this.bot = bot;
    this.logger = logger;

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
    return this.reservedAliases.has(alias);
  }

  public static addReserveredAlias(alias: string) {
    this.reservedAliases.add(alias);
  }

  public static deleteReserveredAlias(alias: string) {
    this.reservedAliases.delete(alias);
  }

  public static registerStaticCommand(aliases: string[], message: string) {
    aliases.forEach((alias) => {
      if (this.isReservedAlias(alias)) return;
    });

    const command = new Command<StaticCallback>({
      permission: Permission.USER,
      aliases: aliases,
      callback: (bot: IBot, channel: string) => {
        bot.sendChannelMessage(message, channel);
      },
    });

    aliases.forEach((alias) => {
      CommandHandler.staticMap.set(alias, command);
    });
  }

  public static deleteStaticCommand(
    commandOrAlias: Command<StaticCallback> | string
  ) {
    let command: Command<StaticCallback> | undefined;
    if (typeof commandOrAlias == "string") {
      command = CommandHandler.staticMap.get(commandOrAlias);
    } else {
      command = commandOrAlias;
    }

    if (!command) return;

    CommandHandler.staticMap.forEach((cmd, alias) => {
      if (cmd == command) CommandHandler.staticMap.delete(alias);
    });
  }

  public static getStaticCommand(alias: string) {
    return CommandHandler.staticMap.get(alias);
  }

  public registerCommand(command: Command<HardCallback>) {
    const aliases = command.getAliases();
    aliases.forEach((alias) => {
      if (this.commandMap.has(alias)) {
        // Duplicate command hardcoded in bot
        if (!this.onFailedRegister(alias)) {
          return;
        }
      }
    });

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

        if (arg.optional) shouldBeOptional = true;

        console.log(arg, shouldBeOptional);
      });
    }
    if (invalidArgs) return;

    command.getAliases().forEach((alias) => {
      // Add alias
      CommandHandler.addReserveredAlias(alias);

      // Store command
      this.commandMap.set(alias, command);
    });
  }

  public handleMessage(user: User, channel: string, msg: string) {
    if (this.onMessage(user, channel, msg)) {
      this.logger.info(
        `onMessage - Canceling (${channel}, ${user.getUsername()}): ${msg}`
      );
      return;
    }

    let hardCommand: Command<HardCallback> | undefined;
    let staticCommand: Command<StaticCallback> | undefined;
    let [alias, args] = this.parseMessage(msg);

    if (this.hasPrefix(msg)) {
      if ((hardCommand = this.commandMap.get(alias))) {
        if (this.onCommand(user, channel, alias, msg)) {
          this.logger.info(
            `onCommand - Canceling (${channel}, ${user.getUsername()}): ${msg}`
          );
          return;
        }

        try {
          args = this.parseArguments(hardCommand, args);
        } catch (e) {
          if (e instanceof TypeError) {
            // A parser didn't like its input
            this.onBadArguments(user, channel, alias, msg);
            return;
          } else {
            throw e;
          }
        }

        if (!this.hasPermission(user, hardCommand)) {
          this.onInsufficientPermission(user, channel, alias, msg);
          this.logger.info(
            `onInsufficientPermission - Canceling (${channel}, ${user.getUsername()}): ${msg}`
          );
          return;
        }

        hardCommand.getCallback()(user, channel, alias, args);
      } else if ((staticCommand = CommandHandler.getStaticCommand(alias))) {
        if (this.onCommand(user, channel, alias, msg)) {
          this.logger.info(
            `onCommand - Canceling (${channel}, ${user.getUsername()}): ${msg}`
          );
          return;
        }

        staticCommand.getCallback()(this.bot, channel);
      }
    } else {
      // Normal message

      // Not sure if I will add anything after this, but just in case...
      if (this.onNormalMessage(user, channel, msg)) {
        this.logger.info(
          `onNormalMessage - Canceling (${channel}, ${user.getUsername()}): ${msg}`
        );
        return;
      }
    }
  }

  public hasPermission(
    user: User,
    aliasOrCommand: string | Command<HardCallback> | undefined
  ) {
    if (typeof aliasOrCommand === "string") {
      aliasOrCommand = this.commandMap.get(aliasOrCommand);
    }

    return (
      aliasOrCommand && aliasOrCommand.getPermission() >= user.getPermission()
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
    const alias = args
      .splice(0, 1)[0]
      .toLowerCase()
      .substring(this.commandPrefix.length);

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
}
