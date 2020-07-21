import User from "./User";
import { ChatUserstate } from "tmi.js";

export default class TwitchUser extends User {
  private userstate: ChatUserstate;

  constructor(userstate: ChatUserstate) {
    super();
    this.userstate = userstate;

    if (userstate.username) this.setUsername(userstate.username);
  }
}
