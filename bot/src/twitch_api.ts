import { getOrCreateUser } from "./mongo/models/UserModel";
import { setFollowed } from "./mongo/models/UserModel";
import { ApiClient, HelixUser } from "twitch";
import { ClientCredentialsAuthProvider } from "twitch-auth";
import { WebHookListener, SimpleAdapter } from "twitch-webhooks";
import { NgrokAdapter } from "twitch-webhooks-ngrok";
import config from "../config.json";
import channelManager, { InvalidChannelError } from "./ChannelManager";

export const twitchAPI = new ApiClient({
  authProvider: new ClientCredentialsAuthProvider(
    config.twitch_client_id,
    config.twitch_client_secret
  ),
});

export const isBroadcasterLive = async (username: string) => {
  return (await twitchAPI.helix.streams.getStreamByUserName(username)) != null;
};

export const getChannelChatters = (username: string) => {
  return twitchAPI.unsupported.getChatters(username);
};

export const getChatterHelixUsers = async (username: string) => {
  const names = (await getChannelChatters(username)).allChatters;
  if (names.length < 0) return;

  return twitchAPI.helix.users.getUsersByNames(names);
};

const broadcasters: Map<string, HelixUser> = new Map();
const getBroadcaster = async (username: string) => {
  let broadcaster: HelixUser | null | undefined;
  broadcaster = broadcasters.get(username);

  if (!broadcaster) {
    broadcaster = await twitchAPI.helix.users.getUserByName(username);

    if (!broadcaster) {
      throw new InvalidChannelError(username);
    }

    // Might be uncessary, but cache under name and id
    broadcasters.set(broadcaster.name, broadcaster);
    broadcasters.set(broadcaster.id, broadcaster);
  }

  return broadcaster;
};

export const getFollowsByName = async (username: string) => {
  const userPromise = twitchAPI.helix.users.getUserByName(username);
  const broadcasterPromise = getBroadcaster(username);

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

const registerPermanentSubs = async (username: string) => {
  const broadcaster = await getBroadcaster(username);

  channelManager
    .getChannel(username)
    .twitchBotLogger.info("Registering permanent subscriptions...");

  await listener.subscribeToFollowsToUser(broadcaster.id, async (follower) => {
    const user = await getOrCreateUser(username, follower.userId);

    if (!user.usedFollowNotification) {
      channelManager.twitchBot.sendChannelMessage(
        `Thanks for the follow @${follower.userDisplayName}! <3`
      );
      await setFollowed(user, follower.followDate);
    }
  });
};

let listener: WebHookListener;
const setupHooks = async () => {
  if (process.env.NODE_ENV === "development") {
    channelManager.miscLogger.info("Starting Ngrok listener!");
    listener = new WebHookListener(twitchAPI, new NgrokAdapter(), {
      hookValidity: 60,
    });
  } else if (process.env.LISTENER_HOST && process.env.LISTENER_PORT) {
    channelManager.miscLogger.info(
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
    channelManager.channels.forEach(async (_channel, username) => {
      await registerPermanentSubs(username);
    });
  }
};

setupHooks();
