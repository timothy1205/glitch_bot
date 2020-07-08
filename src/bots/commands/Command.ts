import { Permission } from "./CommandHandler";
import User from "../User";

export enum CommandArguments {
  STRING,
  NUMBER,
  USER,
}

interface Callback {
  (caller: User, channel: string, alias: string, data?: any[]): void;
}

export default class Command {
  private permission: Permission;
  private aliases: string[];
  private args: CommandArguments[];
  private callback?: Callback;

  constructor(data: {
    permission: Permission;
    aliases: string[];
    args: CommandArguments[];
    callback?: Callback;
  }) {
    this.permission = data.permission;
    this.aliases = data.aliases;
    this.args = data.args;
    this.callback = data.callback;
  }

  public getPermission() {
    return this.permission;
  }

  public getAliases() {
    return this.aliases;
  }

  public getArgs() {
    return this.args;
  }

  public getCallback() {
    return this.callback;
  }
}
