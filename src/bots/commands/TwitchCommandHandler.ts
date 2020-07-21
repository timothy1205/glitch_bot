import CommandHandler from "./CommandHandler";
import IBot from "../IBot";
import { twitchBotLogger } from "../../Logger";

export default class TwitchCommandHandler extends CommandHandler {
  constructor(bot: IBot) {
    super(bot, twitchBotLogger);
  }
}

import "./twitch";
