import User from "./User";

export enum Permission {
  OWNER,
  BROADCASTER,
  MOD,
  VIP,
  SUBSCRIBER,
  FOLLOWER,
  USER,
}

export enum CommandArguments {
  STRING,
  NUMBER,
  USER,
}

interface Callback {
  (caller: User, data?: any[]): void;
}

interface Command {
  permission: Permission;
  args: CommandArguments[];
  callback: Callback;
}

export default abstract class ICommandHandler {
  // Aliases already registered as a command, statically or otherwise.
  private static reservedAliases: Set<string>;

  private commandPrefix: string = "!";
  private commandMap: Map<string, Command> = new Map();

  // Return True to cancel registration abortion
  protected abstract onFailedRegister(alias: string): boolean | void;

  // Return True to halt message interpretation, ran before determining if message is a command
  protected abstract onMessage(user: User, channel: string, msg: string): boolean | void;

  // Return True to halt message interpretation, ran after determining message is not a command
  protected abstract onNormalMessage(user: User, channel: string, msg: string): boolean | void;

  // Return True to halt message interpretation, ran after determining message is a command
  protected abstract onCommand(
    user: User,
    channel: string,
    alias: string,
    msg: string
  ): boolean | void;
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

  public registerCommand(
    aliases: string[],
    permission: Permission,
    args: CommandArguments[],
    callback: Callback
  ) {
    let command: Command = { permission, args, callback };

    aliases.forEach((alias) => {
      if (this.commandMap.has(alias)) {
        // Duplicate command hardcoded in bot
        if (!this.onFailedRegister(alias)) {
          return;
        }
      }

      // Add alias
      ICommandHandler.addReserveredAlias(alias);

      // Store command
      this.commandMap.set(alias, command);
    });
  }

  public hasPermission(user: User, alias: string) {
    let command = this.commandMap.get(alias);
    return command && command.permission > user.getPermission();
  }
}
