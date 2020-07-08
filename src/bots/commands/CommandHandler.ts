import User from "../User";
import winston from "winston";
import IBot from "../IBot";
import Command from "./Command";

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
  private static staticMap: Map<string, string>;

  private commandPrefix: string = "!";
  private commandMap: Map<string, Command> = new Map();
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

  public static getStaticMessage(alias: string) {
    return this.staticMap.get(alias);
  }

  public static setStaticMessage(alias: string, msg: string) {
    this.staticMap.set(alias, msg);
  }

  public static deleteStaticMessage(alias: string) {
    this.staticMap.delete(alias);
  }

  public registerCommand(command: Command) {
    command.getAliases().forEach((alias) => {
      if (this.commandMap.has(alias)) {
        // Duplicate command hardcoded in bot
        if (!this.onFailedRegister(alias)) {
          return;
        }
      }

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

    let command: Command | undefined;
    let [alias, args] = this.parseMessage(msg);

    if (this.hasPrefix(msg) && (command = this.commandMap.get(alias))) {
      // Valid command
      if (this.onCommand(user, channel, alias, msg)) {
        this.logger.info(
          `onCommand - Canceling (${channel}, ${user.getUsername()}): ${msg}`
        );
        return;
      }

      if (command.isStatic) {
        let staticMessage = CommandHandler.getStaticMessage(alias);

        if (staticMessage) {
          this.bot.sendChannelMessage(staticMessage);
        }
      } else {
        // Hard coded command
        if (command.callback) {
          // TODO: Parse args into their respetive formats.
          // Use normal methods for basic types, and an abstract method for 'advanced' types like users
          command.callback(user, channel, alias, args);
        }
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
    return command && command.permission > user.getPermission();
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
