import { Permission } from "./CommandHandler";

export default abstract class User {
  private permission: Permission;

  constructor(permission: Permission) {
    this.permission = permission;
  }

  public getPermission() {
    return this.permission;
  }

  public setPermission(permission: Permission) {
    this.permission = permission;
  }
}
