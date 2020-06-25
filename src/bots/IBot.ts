import CommandHandler from "./CommandHandler";
import User from "./User";

export default abstract class IBot {
  private commandHandler: CommandHandler | null = null;

  public abstract sendChanelMessage(channel: string, msg: string): void;
  public abstract privateMessage(user: User, msg: string): void;

  public setCommandHandler(commandHandler: CommandHandler) {
    this.commandHandler = commandHandler;
  }

  public getCommandHandler() {
    return this.commandHandler;
  }
}
