import Channel, { ChannelConfig } from "./Channel";

class ChannelManager {
  private channels: { [username: string]: Channel } = {};

  public createChannel(channelConfig: ChannelConfig) {
    this.channels[channelConfig.username] = new Channel(channelConfig);
  }

  public getChannel(username: string) {
    return this.channels[username];
  }
}

const channelManager = new ChannelManager();
export default channelManager;
