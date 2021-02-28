import winston from "winston";
import TwitchCommandHandler from "./bots/commands/TwitchCommandHandler";
import TwitchBot from "./bots/TwitchBot";
import { createLogger } from "./logging";

export interface ChannelConfig {
  username: string;
  currency_name: string;
  currency_name_plural?: string;
  currency_emoji: string;
}

export default class Channel {
  private twitchBotLogger: winston.Logger;
  private twitchBot: TwitchBot;

  constructor(channelConfig: ChannelConfig) {
    this.twitchBotLogger = createLogger(`${channelConfig.username}/twitch`);

    const twitchCommandHandler = new TwitchCommandHandler();
    this.twitchBot = new TwitchBot(twitchCommandHandler, channelConfig);
  }
}
