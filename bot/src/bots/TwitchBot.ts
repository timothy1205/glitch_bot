import { aknowledgeMessage } from "./../auto_messages";
import { Client, Options } from "tmi.js";
import IBot from "./IBot";
import IUser from "./IUser";
import { twitchBotLogger } from "../logging";
import TwitchUser from "./TwitchUser";
import TwitchCommandHandler from "./commands/TwitchCommandHandler";

const tmiOptions: Options = {
  identity: {
    username: process.env.TWITCH_USERNAME,
    password: process.env.TMI_OAUTH_TOKEN,
  },
  channels: process.env.TWITCH_WORKING_CHANNEL
    ? [process.env.TWITCH_WORKING_CHANNEL]
    : [],
  connection: {
    reconnect: true,
  },
  options: {
    debug: process.env.NODE_ENV !== "production",
  },
  logger: twitchBotLogger,
};

class TwitchBot extends IBot {
  private tmiClient: Client;
  public useFollowNotifications: boolean;

  constructor(twitchCommandHandler: TwitchCommandHandler) {
    super();

    this.setCommandHandler(twitchCommandHandler);
    twitchCommandHandler.setBot(this);

    this.tmiClient = Client(tmiOptions);
    this.tmiClient.addListener("message", (channel, userstate, msg, self) => {
      const user = new TwitchUser(userstate);
      twitchCommandHandler.handleMessage({
        user,
        channel,
        msg,
      });

      if (userstate.username !== process.env.TWITCH_USERNAME)
        aknowledgeMessage();
    });

    this.connect();

    this.useFollowNotifications = true;
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
}

const twitchBot = new TwitchBot(new TwitchCommandHandler());
export default twitchBot;
