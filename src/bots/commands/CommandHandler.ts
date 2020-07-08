import User from "../User";
import winston from "winston";
import IBot from "../IBot";
import Command from "./Command";
import { HardCallback, StaticCallback } from "./Command";

export enum Permission {
  OWNER,
  BROADCASTER,
  MOD,
  VIP,
  SUBSCRIBER,
  FOLLOWER,
  USER,
}

export default class CommandHandler {
  // Aliases already registered as a command, statically or otherwise.
  private static reservedAliases: Set<string>;
  private static staticMap: Map<string, Command<StaticCallback>>;

  private commandPrefix: string = "!";
  private commandMap: Map<string, Command<HardCallback>> = new Map();
  private bot: IBot;
  private logger: winston.Logger;

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

  constructor(bot: IBot, logger: winston.Logger) {
    this.bot = bot;
    this.logger = logger;
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
      this.staticMap.set(alias, command);
    });
  }

  public static deleteStaticCommand(
    commandOrAlias: Command<StaticCallback> | string
  ) {
    let command: Command<StaticCallback> | undefined;
    if (typeof commandOrAlias == "string") {
      command = this.staticMap.get(commandOrAlias);
    } else {
      command = commandOrAlias;
    }

    if (!command) return;

    this.staticMap.forEach((cmd, alias) => {
      if (cmd == command) this.staticMap.delete(alias);
    });
  }

  public static getStaticCommand(alias: string) {
    return this.staticMap.get(alias);
  }

  public registerCommand(command: Command<HardCallback>) {
    command.getAliases().forEach((alias) => {
      if (this.commandMap.has(alias)) {
        // Duplicate command hardcoded in bot
        if (!this.onFailedRegister(alias)) {
          return;
        }
      }
    });

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

        // TODO: Parse args into their respetive formats.
        // Use normal methods for basic types, and an abstract method for 'advanced' types like users
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

  public hasPermission(user: User, alias: string) {
    let command = this.commandMap.get(alias);
    return command && command.getPermission() > user.getPermission();
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
}
