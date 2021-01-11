import { ApiClient } from "twitch";
import { ClientCredentialsAuthProvider } from "twitch-auth";

export const twitchAPI = new ApiClient({
  authProvider: new ClientCredentialsAuthProvider(
    process.env.TWITCH_CLIENT_ID || "",
    process.env.TWITCH_CLIENT_SECRET || ""
  ),
});

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

export const getChatterHelixUsers = async () => {
  const names = (await getChannelChatters()).allChatters;
  if (names.length < 0) return;

  return twitchAPI.helix.users.getUsersByNames(names);
};

const getBroadcaster = () => {
  return twitchAPI.helix.users.getUserByName(
    process.env.TWITCH_WORKING_CHANNEL || ""
  );
};

export const getFollowsByName = async (name: string) => {
  const userPromise = twitchAPI.helix.users.getUserByName(name);
  const broadcasterPromise = getBroadcaster();

  const [helixUser, broadcasterHelixUser] = await Promise.all([
    userPromise,
    broadcasterPromise,
  ]);

  if (helixUser && broadcasterHelixUser) {
    const paginatedFollowUser = await twitchAPI.helix.users.getFollows({
      user: helixUser,
      followedUser: broadcasterHelixUser,
    });

    if (paginatedFollowUser.data.length === 0) return;

    return paginatedFollowUser.data[0];
  }
};

export const getFollowsByID = async (twitchId: string) => {
  const broadcasterHelixUser = await getBroadcaster();
  if (broadcasterHelixUser) {
    const paginatedFollowUser = await twitchAPI.helix.users.getFollows({
      user: twitchId,
      followedUser: broadcasterHelixUser,
    });
    if (paginatedFollowUser.data.length > 0) return;

    return paginatedFollowUser.data[0];
  }
};
