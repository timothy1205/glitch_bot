import { getOrCreateUser } from "./mongo/models/UserModel";
import { twitchBotLogger } from "./logging";
import twitchBot from "./bots/TwitchBot";
import { setFollowed } from "./mongo/models/UserModel";
import { ApiClient, HelixUser } from "twitch";
import { ClientCredentialsAuthProvider } from "twitch-auth";
import { WebHookListener, SimpleAdapter } from "twitch-webhooks";
import { NgrokAdapter } from "twitch-webhooks-ngrok";

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

let broadcaster: Promise<HelixUser | null>;
const getBroadcaster = () => {
  if (!broadcaster) {
    broadcaster = twitchAPI.helix.users.getUserByName(
      process.env.TWITCH_WORKING_CHANNEL || ""
    );
  }

  return broadcaster;
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

const registerPermanentSubs = async () => {
  const broadcaster = await getBroadcaster();
  if (!broadcaster) {
    twitchBotLogger.warn(
      "Failed to register twitch subscriptions due to invalid broadcaster"
    );
    return;
  }

  twitchBotLogger.info("Registering permanent subscriptions...");

  await listener.subscribeToFollowsToUser(broadcaster.id, async (follower) => {
    if (!twitchBot.useFollowNotifications) return;

    const user = await getOrCreateUser(follower.userId);

    if (!user.usedFollowNotification) {
      twitchBot.sendChannelMessage(
        `Thanks for the follow @${follower.userDisplayName}! <3`
      );
      await setFollowed(user, follower.followDate);
    }
  });
};

let listener: WebHookListener;
const setupHooks = async () => {
  if (process.env.NODE_ENV === "development") {
    twitchBotLogger.info("Starting Ngrok listener!");
    listener = new WebHookListener(twitchAPI, new NgrokAdapter(), {
      hookValidity: 60,
    });
  } else if (process.env.LISTENER_HOST && process.env.LISTENER_PORT) {
    twitchBotLogger.info(
      `Starting Simple Webhook Listener on ${process.env.LISTENER_HOST}:${process.env.LISTENER_PORT}`
    );
    listener = new WebHookListener(
      twitchAPI,
      new SimpleAdapter({
        hostName: process.env.LISTENER_HOST,
        listenerPort: parseInt(process.env.LISTENER_PORT),
      })
    );
  }

  if (listener) {
    await listener.listen();
    await registerPermanentSubs();
  }
};

setupHooks();
