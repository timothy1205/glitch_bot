import { Client, Options } from "tmi.js";
import IBot from "./IBot";
import User from "./User";

const tmiOptions: Options = {
  identity: {
    username: process.env.TWITCH_USERNAME,
    password: process.env.TWITCH_OAUTH_TOKEN,
  },
  channels: process.env.TWITCH_WORKING_CHANNEL
    ? [process.env.TWITCH_WORKING_CHANNEL]
    : [],
  connection: {
    reconnect: true,
  },
  options: {
    debug: process.env.NODE_ENV !== "production",
  },
};

class TwitchBot extends IBot {
  private tmiClient: Client;

  constructor() {
    super();

    this.tmiClient = Client(tmiOptions);
  }

  public sendChanelMessage(channel: string, msg: string): void {
    this.tmiClient.say(channel, msg);
  }
  public privateMessage(user: User, msg: string): void {
    this.tmiClient.whisper();
  }
}
