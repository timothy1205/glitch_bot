import winston from "winston";
import TwitchBot from "./bots/TwitchBot";
import Channel, { ChannelConfig } from "./Channel";
import { createLogger } from "./logging";

export class InvalidChannelError extends Error {
  constructor(username: string) {
    super(username);
    this.message = `Invalid channel: '${username}', is the name correct?`;
  }
}

class ChannelManager {
  private _channels: Map<string, Channel>;
  private _miscLogger: winston.Logger;
  private _twitchBot: TwitchBot;

  constructor() {
    this._channels = new Map();
    this._miscLogger = createLogger("misc");
    this._twitchBot = new TwitchBot();
  }

  public createChannel(channelConfig: ChannelConfig) {
    this._channels.set(channelConfig.username, new Channel(channelConfig));
  }

  public getChannel(username: string) {
    const channel = this._channels.get(username);

    if (!channel) {
      throw new InvalidChannelError(username);
    }

    return channel;
  }

  public get channels() {
    return this._channels;
  }

  public get miscLogger() {
    return this._miscLogger;
  }

  public get twitchBot() {
    return this._twitchBot;
  }
}

const channelManager = new ChannelManager();
export default channelManager;
