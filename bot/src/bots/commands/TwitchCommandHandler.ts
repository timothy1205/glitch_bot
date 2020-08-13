import CommandHandler from "./CommandHandler";
import IBot from "../IBot";
import { twitchBotLogger } from "../../logging";
import { CommandArguments } from "./Command";
import twitchBot from "../TwitchBot";

class TwitchCommandHandler extends CommandHandler {
  constructor(bot: IBot) {
    super(bot, twitchBotLogger);

    this.registerParser(CommandArguments.USER, (original) => {
      if (!original.startsWith("@"))
        throw new TypeError("Expected string beginning with @");

      return original.substr(1);
    });
  }

  protected getArgTypeAsString(arg: CommandArguments) {
    if (arg == CommandArguments.USER) return "@user";

    return super.getArgTypeAsString(arg);
  }
}

const twitchCommandHanlder = new TwitchCommandHandler(twitchBot);
export default twitchCommandHanlder;
