import CommandHandler from "./CommandHandler";
import IBot from "../IBot";
import { twitchBotLogger } from "../../logging";
import IUser from "../IUser";
import { CommandArguments } from "./Command";

export default class TwitchCommandHandler extends CommandHandler {
  constructor(bot: IBot) {
    super(bot, twitchBotLogger);
  }

  protected getArgTypeAsString(arg: CommandArguments) {
    if (arg == CommandArguments.USER) return "@user";

    return super.getArgTypeAsString(arg);
  }
}
