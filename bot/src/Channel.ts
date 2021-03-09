import winston from "winston";
import TwitchCommandHandler from "./bots/commands/TwitchCommandHandler";
import channelManager from "./ChannelManager";
import { createLogger } from "./logging";

export interface ChannelConfig {
  username: string;
  currency_name: string;
  currency_name_plural?: string;
  currency_emoji: string;
}

export default class Channel {
  private _twitchBotLogger: winston.Logger;
  private _twitchCommandHandler: TwitchCommandHandler;
  private _twitchConfig: ChannelConfig;

  constructor(channelConfig: ChannelConfig) {
    this._twitchBotLogger = createLogger(`${channelConfig.username}/twitch`);
    this._twitchCommandHandler = new TwitchCommandHandler();
    this._twitchCommandHandler.setBot(channelManager.twitchBot);
    this._twitchConfig = channelConfig;
  }

  public get twitchBotLogger() {
    return this._twitchBotLogger;
  }

  public get twitchConfig() {
    return this._twitchConfig;
  }
}
