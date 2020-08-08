import TwitchClient from "twitch";

export const twitchAPI = TwitchClient.withClientCredentials(
  process.env.TWITCH_CLIENT_ID || "",
  process.env.TWITCH_CLIENT_SECRET
);

export const isBroadcasterLive = async () => {
  return (
    (await twitchAPI.helix.streams.getStreamByUserName(
      process.env.TWITCH_WORKING_CHANNEL || ""
    )) != null
  );
};

export const getChannelChatters = () => {
  return twitchAPI.unsupported.getChatters(
    process.env.TWITCH_WORKING_CHANNEL || ""
  );
};
