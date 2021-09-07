import assert from "assert";
import { ApiClient, HelixUser } from "twitch";
import { ClientCredentialsAuthProvider } from "twitch-auth";
import {
  DirectConnectionAdapter,
  EnvPortAdapter,
  EventSubListener,
  ReverseProxyAdapter,
} from "twitch-eventsub";
import { NgrokAdapter } from "twitch-eventsub-ngrok";
import twitchBot from "./bots/TwitchBot";
import { twitchBotLogger } from "./logging";
import { getOrCreateUser, setFollowed } from "./mongo/models/UserModel";

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
// TODO: Setup EventSubLister which needs an SSL Cert
// https://d-fischer.github.io/twitch-eventsub/docs/basic-usage/listening-to-events.html
const setupHooks = async () => {
  assert.ok(process.env.TWITCH_EVENTSUB_SECRET);
  if (process.env.NODE_ENV === "development") {
    twitchBotLogger.info("Starting Ngrok listener!");
    listener = new EventSubListener(
      twitchAPI,
      new NgrokAdapter(),
      process.env.TWITCH_EVENTSUB_SECRET
    );
  } else {
    assert.ok(process.env.LISTENER_HOST);

    twitchBotLogger.info(
      `Starting EventSubListener on ${process.env.LISTENER_HOST}:${process.env.LISTENER_PORT}`
    );
    listener = new EventSubListener(
      twitchAPI,
      new EnvPortAdapter({
        hostName: process.env.LISTENER_HOST,
        variableName: "LISTENER_PORT",
      }),
      process.env.TWITCH_EVENTSUB_SECRET
    );
  }

  if (listener) {
    // Clear subscriptions and start fresh...
    await twitchAPI.helix.eventSub.deleteAllSubscriptions();
    await listener.listen();
    await registerPermanentSubs();
  }
};

setupHooks();
