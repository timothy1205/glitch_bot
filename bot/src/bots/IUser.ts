import { Permission } from "./commands/CommandHandler";

export abstract class IUser {
  private permission: Permission = Permission.USER;
  private username: string = "";

  constructor() {}

  public abstract getID(): string | undefined;

  public getPermission() {
    return this.permission;
  }

  public setPermission(permission: Permission) {
    this.permission = permission;
    return this;
  }

  public getUsername() {
    return this.username;
  }

  public setUsername(username: string) {
    this.username = username;
    return this;
  }
}
