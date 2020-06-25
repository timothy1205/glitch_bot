import { Permission } from "./CommandHandler";

export default abstract class User {
  private permission: Permission;
  private username: string;

  constructor(permission: Permission) {
    this.permission = permission;
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
