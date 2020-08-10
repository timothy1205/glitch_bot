import { Client, Options } from "tmi.js";
import IBot from "./IBot";
import IUser from "./IUser";
import { twitchBotLogger } from "../logging";
import TwitchUser from "./TwitchUser";

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
  logger: twitchBotLogger,
};

export default class TwitchBot extends IBot {
  private tmiClient: Client;

  constructor() {
    super();

    this.tmiClient = Client(tmiOptions);
    this.tmiClient.addListener("chat", (channel, userstate, msg, self) => {
      this.getCommandHandler()?.handleMessage({
        user: new TwitchUser(userstate),
        channel,
        msg,
      });
    });
  }

  public sendChannelMessage(msg: string, channel?: string): Promise<any> {
    if (!channel) channel = process.env.TWITCH_WORKING_CHANNEL || "";

    return this.tmiClient.say(channel, msg);
  }

  public reply(user: IUser, msg: string, channel?: string): Promise<any> {
    return this.sendChannelMessage(`@${user.getUsername()}, ${msg}`, channel);
  }

  public privateMessage(user: IUser, msg: string): Promise<any> {
    return this.tmiClient.whisper(user.getUsername(), msg);
  }

  public connect() {
    return this.tmiClient.connect();
  }
}

// TODO: Implement tmi.js JOIN and PART events for things like watch time/points.
