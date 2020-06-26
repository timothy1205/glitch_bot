import { Permission } from "./CommandHandler";

export default class User {
  private permission: Permission;
  private username: string;

  constructor(username: string, permission: Permission) {
    this.permission = permission;
    this.username = username;
  }

  public getPermission() {
    return this.permission;
  }

  public setPermission(permission: Permission) {
    this.permission = permission;
  }

  public getUsername() {
    return this.username;
  }

  public setUsername(username: string) {
    this.username = username;
  }
}
