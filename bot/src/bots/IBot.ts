import CommandHandler from "./commands/CommandHandler";
import IUser from "./IUser";

export default abstract class IBot {
  private commandHandler: CommandHandler | null = null;

  public abstract sendChannelMessage(
    msg: string,
    channel?: string
  ): Promise<any>;

  public abstract reply(
    user: IUser,
    msg: string,
    channel?: string
  ): Promise<any>;

  public abstract privateMessage(user: IUser, msg: string): Promise<any>;

  public setCommandHandler(commandHandler: CommandHandler) {
    this.commandHandler = commandHandler;
  }

  public getCommandHandler() {
    return this.commandHandler;
  }
}
