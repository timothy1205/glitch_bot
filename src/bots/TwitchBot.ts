import { Client, Options } from "tmi.js";
import IBot from "./IBot";
import User from "./User";
import { twitchBotLogger } from "../Logger";

const tmiOptions: Options = {
  identity: {
    username: process.env.TWITCH_USERNAME,
    password: process.env.TMI_OAUTH_TOKEN,
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

export default class TwitchBot extends IBot {
  private tmiClient: Client;

  constructor() {
    super();

    this.tmiClient = Client(tmiOptions);
  }

  public sendChannelMessage(msg: string, channel?: string): void {
    if (!channel) channel = process.env.TWITCH_WORKING_CHANNEL || "";

    this.tmiClient.say(channel, msg);
  }

  public privateMessage(user: User, msg: string): void {
    this.tmiClient.whisper(user.getUsername(), msg);
  }

  public connect() {
    let promise = this.tmiClient.connect();

    promise
      .then(([server, port]) => {
        twitchBotLogger.info(`Successfully connected to ${server}:${port}`);
      })
      .catch((err) => {
        twitchBotLogger.warn(`Failed to connect to a server`);
      });

    return promise;
  }
}
