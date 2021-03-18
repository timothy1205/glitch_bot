import CommandHandler from "./CommandHandler";
import { CommandArguments } from "./Command";
import winston from "winston";

export default class TwitchCommandHandler extends CommandHandler {
  constructor(logger: winston.Logger) {
    super(logger);

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
