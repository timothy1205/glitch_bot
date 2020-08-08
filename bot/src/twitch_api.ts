import TwitchClient from "twitch";

const twitchAPI = TwitchClient.withClientCredentials(
  process.env.TWITCH_CLIENT_ID || "",
  process.env.TWITCH_CLIENT_SECRET
);

export default twitchAPI;
