import { Permission } from "./ICommandHandler";

export default abstract class IUser {
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
