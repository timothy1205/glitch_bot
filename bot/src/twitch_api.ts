import assert from "assert";
import { ApiClient, HelixUser } from "@twurple/api";
import { ClientCredentialsAuthProvider } from "@twurple/auth";
import { EventSubListener, ReverseProxyAdapter } from "@twurple/eventsub";
import { NgrokAdapter } from "@twurple/eventsub-ngrok";
import { twitchBot } from "./bots/TwitchBot";
import { twitchBotLogger } from "./logging";
import { getOrCreateUser, setFollowed } from "./mongo/models/UserModel";

assert.ok(process.env.TWITCH_CLIENT_ID);
assert.ok(process.env.TWITCH_CLIENT_SECRET);

export const twitchAPI = new ApiClient({
  authProvider: new ClientCredentialsAuthProvider(
    process.env.TWITCH_CLIENT_ID,
    process.env.TWITCH_CLIENT_SECRET
  ),
});

export const isBroadcasterLive = async () => {
  assert.ok(process.env.TWITCH_WORKING_CHANNEL);

  return (
    (await twitchAPI.streams.getStreamByUserName(
      process.env.TWITCH_WORKING_CHANNEL
    )) != null
  );
};

export const getChannelChatters = () => {
  assert.ok(process.env.TWITCH_WORKING_CHANNEL);

  return twitchAPI.unsupported.getChatters(process.env.TWITCH_WORKING_CHANNEL);
};

export const getChatterHelixUsers = async () => {
  const names = (await getChannelChatters()).allChatters;
  if (names.length < 0) return;

  return twitchAPI.users.getUsersByNames(names);
};

let broadcaster: Promise<HelixUser | null>;
const getBroadcaster = () => {
  assert.ok(process.env.TWITCH_WORKING_CHANNEL);

  if (!broadcaster) {
    broadcaster = twitchAPI.users.getUserByName(
      process.env.TWITCH_WORKING_CHANNEL
    );
  }

  return broadcaster;
};

export const getFollowsByName = async (name: string) => {
  const userPromise = twitchAPI.users.getUserByName(name);
  const broadcasterPromise = getBroadcaster();

  const [helixUser, broadcasterHelixUser] = await Promise.all([
    userPromise,
    broadcasterPromise,
  ]);

  if (helixUser && broadcasterHelixUser) {
    const paginatedFollowUser = await twitchAPI.users.getFollows({
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
    const paginatedFollowUser = await twitchAPI.users.getFollows({
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

  try {
    await listener.subscribeToChannelFollowEvents(
      broadcaster.id,
      async (event) => {
        if (!twitchBot.useFollowNotifications) return;

        const user = await getOrCreateUser(event.userId);

        if (!user.usedFollowNotification) {
          twitchBot.sendChannelMessage(
            `Thanks for the follow @${event.userDisplayName}! <3`
          );
          await setFollowed(user, event.followDate);
        }
      }
    );
  } catch (error) {
    if (error instanceof Error) {
      twitchBotLogger.warn(
        `Failed to register twitch subscriptions: ${error.message}`
      );
    }
  }
};

let listener: EventSubListener;
const setupHooks = async () => {
  assert.ok(process.env.TWITCH_EVENTSUB_SECRET);

  if (process.env.NODE_ENV === "development") {
    twitchBotLogger.info("Starting Ngrok listener!");
    listener = new EventSubListener({
      apiClient: twitchAPI,
      adapter: new NgrokAdapter(),
      secret: process.env.TWITCH_EVENTSUB_SECRET,
    });
  } else {
    assert.ok(process.env.LISTENER_HOST);
    assert.ok(process.env.LISTENER_PORT);

    twitchBotLogger.info(
      `Starting EventSubListener on ${process.env.LISTENER_HOST}:${process.env.LISTENER_PORT}`
    );
    listener = new EventSubListener({
      apiClient: twitchAPI,
      adapter: new ReverseProxyAdapter({
        hostName: process.env.LISTENER_HOST,
        port: parseInt(process.env.LISTENER_PORT),
      }),
      secret: process.env.TWITCH_EVENTSUB_SECRET,
    });
  }

  if (listener) {
    // Clear subscriptions and start fresh...
    await twitchAPI.eventSub.deleteAllSubscriptions();
    await listener.listen();
    await registerPermanentSubs();
  }
};

setupHooks();
