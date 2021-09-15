import { Permission } from "./CommandHandler";
import { IUser } from "../IUser";
import { IBot } from "../IBot";

export enum CommandArguments {
  STRING,
  NUMBER,
  USER,
}

// TODO: Is there a way to require Command instances to specify a generic?
export type CommandHC = Command<HardCallback<any>>;

export enum CommandCategories {
  STATIC,
  SHARED_ADMIN,
  SHARED_CMD,
  TWITCH_ADMIN,
  TWITCH_UTILS,
}

export interface CommandArgumentWrapper {
  arg: CommandArguments;
  name: string;
  optional?: boolean;
}

export interface HardCallback<U> {
  (caller: IUser, channel: string, alias: string, data: U, bot: IBot): void;
}

export interface StaticCallback {
  (bot: IBot, channel: string): void;
}

export class Command<T> {
  private permission: Permission;
  private aliases: string[];
  private args?: CommandArgumentWrapper[];
  private category?: CommandCategories;
  private callback: T;

  constructor(data: {
    permission: Permission;
    aliases: string[];
    args?: CommandArgumentWrapper[];
    category?: CommandCategories;
    callback: T;
  }) {
    this.permission = data.permission;
    this.aliases = data.aliases;
    this.args = data.args;
    this.category = data.category;
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

  public getCategory() {
    return this.category;
  }

  public getCallback() {
    return this.callback;
  }
}

/*
  A sub command container is defined as a 'command'
  that will hold other commands or sub command containers.
  A sub command container will not have its own callback as it
  is not actually a command.
*/
export class SubCommandContainer {
  private aliases: string[];
  private commands: {
    [alias: string]: SubCommandContainer | CommandHC;
  } = {};
  private registered = false;

  constructor(aliases: string[]) {
    this.aliases = aliases;
  }

  public getAliases() {
    return this.aliases;
  }

  public addCommand(command: SubCommandContainer | CommandHC) {
    if (command instanceof SubCommandContainer) {
      if (command.getRegistered())
        throw "Attempting to register a command that is already registered...";
      else command.setRegistered(true);
    }

    command.getAliases().forEach((alias) => {
      if (this.commands[alias])
        throw "Attempting to register a command that is already registered...";
    });

    command.getAliases().forEach((alias) => {
      this.commands[alias] = command;
    });

    return this;
  }

  public getCommands() {
    return this.commands;
  }

  public getRegistered() {
    return this.registered;
  }

  public setRegistered(status: boolean) {
    this.registered = status;
  }
}

export class CommandHCGeneric<T> extends Command<HardCallback<T>> {}
