import { aknowledgeMessage } from "./../auto_messages";
import { ChatUserstate, Client } from "tmi.js";
import IBot from "./IBot";
import IUser from "./IUser";
import TwitchUser from "./TwitchUser";
import { acknowledgeChatter } from "../passive_stats";
import TwitchCommandHandler from "./commands/TwitchCommandHandler";
import config from "../../config.json";
import channelManager from "../ChannelManager";
import CommandHandler from "./commands/CommandHandler";

export default class TwitchBot extends IBot {
  private tmiClient: Client;
  private _currentMessageListener!: (
    channel: string,
    userstate: ChatUserstate,
    message: string,
    self: boolean
  ) => void;

  constructor(twitchCommandHandler?: TwitchCommandHandler) {
    super();

    if (twitchCommandHandler) {
      this.setCommandHandler(twitchCommandHandler);
      twitchCommandHandler.setBot(this);
    }

    this.tmiClient = Client({
      identity: {
        username: config.twitch_username,
        password: config.tmi_oauth_token,
      },
      channels: config.channels.map((channel) => channel.username),
      connection: {
        reconnect: true,
      },
      options: {
        debug: process.env.NODE_ENV === "development",
      },
      logger: channelManager.miscLogger,
    });

    this.connect();
  }

  public sendChannelMessage(msg: string, channel?: string): Promise<any> {
    if (!channel) channel = process.env.TWITCH_WORKING_CHANNEL || "";

    return this.tmiClient.say(channel, msg);
  }

  public reply(user: IUser, msg: string, channel?: string): Promise<any> {
    return this.sendChannelMessage(`@${user.getUsername()}, ${msg}`, channel);
  }

  public privateMessage(user: IUser, msg: string): Promise<any> {
    return this.tmiClient.whisper(user.getUsername(), msg);
  }

  public connect() {
    return this.tmiClient.connect();
  }

  public setCommandHandler(commandHandler: CommandHandler) {
    super.setCommandHandler(commandHandler);

    this.tmiClient.removeListener("message", this._currentMessageListener);
    this.tmiClient.addListener(
      "message",
      this._messageListenerCreator(commandHandler)
    );
  }

  private _messageListenerCreator(commandHandler: CommandHandler) {
    this._currentMessageListener = (channel, userstate, msg) => {
      const user = new TwitchUser(userstate);
      commandHandler.handleMessage({
        user,
        channel,
        msg,
      });

      if (userstate["user-id"])
        acknowledgeChatter(userstate["user-id"], user.getPermission());
      if (userstate.username !== process.env.TWITCH_USERNAME)
        aknowledgeMessage();
    };

    return this._currentMessageListener;
  }
}
