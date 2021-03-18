import IUser from "./IUser";
import { ChatUserstate, Badges } from "tmi.js";
import { Permission } from "./commands/CommandHandler";
import config from "../../config.json";

const calculatePerms = (userstate: ChatUserstate) => {
  if (userstate.badges) {
    if (userstate["user-id"] === config.owner_id) return Permission.OWNER;
    else if (userstate.badges.broadcaster === "1")
      return Permission.BROADCASTER;
    else if (userstate.mod) return Permission.MOD;
    else if (userstate.badges.vip === "1") return Permission.VIP;
    else if (userstate.subscriber) return Permission.SUBSCRIBER;
  }

  return Permission.USER;
};
export default class TwitchUser extends IUser {
  private userstate: ChatUserstate;

  constructor(userstate: ChatUserstate) {
    super();
    this.userstate = userstate;

    if (userstate.username) this.setUsername(userstate.username);
    this.setPermission(calculatePerms(userstate));
  }

  public getID(): string | undefined {
    return this.userstate["user-id"];
  }
}
