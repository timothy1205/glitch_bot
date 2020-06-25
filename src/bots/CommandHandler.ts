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

export default abstract class CommandHandler {
  // Aliases already registered as a command, statically or otherwise.
  private static reservedAliases: Set<string>;

  private commandPrefix: string = "!";
  private commandMap: Map<string, Command> = new Map();

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
      if (CommandHandler.isReservedAlias(alias)) {
        // Duplicate command hardcoded in bot
        // TODO: Implement logger with error method that terminates application
      }

      // Add alias
      CommandHandler.addReserveredAlias(alias);

      // Store command
      this.commandMap.set(alias, command);
    });
  }

  public hasPermission(user: User, alias: string) {
    let command = this.commandMap.get(alias);
    return command && command.permission > user.getPermission();
  }
}
