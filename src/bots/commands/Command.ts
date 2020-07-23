import { Permission } from "./CommandHandler";
import User from "../User";
import IBot from "../IBot";

export enum CommandArguments {
  STRING,
  NUMBER,
  USER,
}

export interface CommandArgumentWrapper {
  arg: CommandArguments;
  name: string;
  optional?: boolean;
}

export interface HardCallback {
  (caller: User, channel: string, alias: string, data?: any[]): void;
}

export interface StaticCallback {
  (bot: IBot, channel: string): void;
}

export default class Command<T> {
  private permission: Permission;
  private aliases: string[];
  private args?: CommandArgumentWrapper[];
  private callback: T;

  constructor(data: {
    permission: Permission;
    aliases: string[];
    args?: CommandArgumentWrapper[];
    callback: T;
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
