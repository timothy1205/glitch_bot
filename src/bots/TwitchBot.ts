import { Client, Options } from "tmi.js";
import IBot from "./IBot";
import User from "./User";
import { twitchBotLogger } from "../Logger";
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
      this.getCommandHandler()?.handleMessage(
        new TwitchUser(userstate),
        channel,
        msg
      );
    });
  }

  public sendChannelMessage(msg: string, channel?: string): Promise<any> {
    if (!channel) channel = process.env.TWITCH_WORKING_CHANNEL || "";

    return this.tmiClient.say(channel, msg);
  }

  public reply(user: User, msg: string, channel?: string): Promise<any> {
    return this.sendChannelMessage(`@${user.getUsername}, ${msg}`, channel);
  }

  public privateMessage(user: User, msg: string): Promise<any> {
    return this.tmiClient.whisper(user.getUsername(), msg);
  }

  public connect() {
    return this.tmiClient.connect();
  }
}
