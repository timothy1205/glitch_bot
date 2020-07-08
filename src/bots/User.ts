import { Permission } from "./commands/ICommandHandler";

export default class User {
  private permission: Permission = Permission.USER;
  private username: string = "";

  constructor() {}

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
