import ICommandHandler from "./ICommandHandler";
import IUser from "./IUser";

export default abstract class IBot {
  private commandHandler: ICommandHandler | null = null;

  public abstract sendChanelMessage(channel: string, msg: string): void;
  public abstract privateMessage(user: IUser, msg: string): void;

  public setCommandHandler(commandHandler: ICommandHandler) {
    this.commandHandler = commandHandler;
  }

  public getCommandHandler() {
    return this.commandHandler;
  }
}
