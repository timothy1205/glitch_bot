import CommandHandler from "./CommandHandler";
import IBot from "../IBot";
import { twitchBotLogger } from "../../Logger";
import User from "../User";

export default class TwitchCommandHandler extends CommandHandler {
  constructor(bot: IBot) {
    super(bot, twitchBotLogger);
  }

  protected onBadArguments(
    user: User,
    channel: string,
    alias: string,
    msg: string
  ) {
    // TODO: Create a method (probably on CommandHandler) to generate a command usage string to be used here
    this.getBot().reply(
      user,
      `you specified invalid arguments for "${alias}"...`
    );
  }
}
