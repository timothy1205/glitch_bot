import { CommandHandler, CommandData } from "./CommandHandler";
import { twitchBotLogger } from "../../logging";
import { CommandArguments } from "./Command";

export class TwitchCommandHandler extends CommandHandler {
  constructor() {
    super(twitchBotLogger);

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

  protected onCommand(data: CommandData) {
    twitchBotLogger.info(
      `[${data.channel}] <${data.user.getUsername()}>: ${data.msg}`
    );
  }
}
