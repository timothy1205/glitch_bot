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

  public sendChannelMessage(msg: string, channel?: string): Promise<any> {
    if (!channel) channel = process.env.TWITCH_WORKING_CHANNEL || "";

    let promise = this.tmiClient.say(channel, msg);

    promise
      .then(() => {
        twitchBotLogger.info(`Sending message to #${channel}: ${msg}`);
      })
      .catch((err) => {
        twitchBotLogger.warn(`Failed to send message to #${channel}: ${msg}`);
      });

    return promise;
  }

  public privateMessage(user: User, msg: string): Promise<any> {
    const username = user.getUsername();

    let promise = this.tmiClient.whisper(username, msg);

    promise
      .then(() => {
        twitchBotLogger.info(`Sending whisper to #${username}: ${msg}`);
      })
      .catch((err) => {
        twitchBotLogger.warn(`Failed to send whisper to #${username}: ${msg}`);
      });

    return promise;
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
