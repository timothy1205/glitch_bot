import winston from "winston";
import TwitchBot from "./bots/TwitchBot";
import Channel, { ChannelConfig } from "./Channel";
import { createLogger } from "./logging";

class ChannelManager {
  private _channels: { [username: string]: Channel } = {};
  private _miscLogger: winston.Logger;
  private _twitchBot: TwitchBot;

  constructor() {
    this._miscLogger = createLogger("misc");
    this._twitchBot = new TwitchBot();
  }

  public createChannel(channelConfig: ChannelConfig) {
    this._channels[channelConfig.username] = new Channel(channelConfig);
  }

  public getChannel(username: string) {
    return this._channels[username];
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
