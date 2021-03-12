import { isBroadcasterLive, getChatterHelixUsers } from "./twitch_api";
import { Permission } from "./bots/commands/CommandHandler";
import { twitchBotLogger } from "./logging";
import { addPoints, addWatchTime } from "./mongo/models/UserModel";
import config from "../config.json";

// Intervals in minutes
const timerInterval = 20;
const acknowledgeResetInterval = 5;
const watchTimeInterval = 5;

const watchMultiplier = 4;
const chatMultiplier = 1;

const pointsPerInterval: Map<Permission, number> = new Map();
pointsPerInterval.set(Permission.USER, 1);
pointsPerInterval.set(Permission.FOLLOWER, 1);
pointsPerInterval.set(Permission.SUBSCRIBER, 2);
pointsPerInterval.set(Permission.VIP, 2);
pointsPerInterval.set(Permission.MOD, 2);
pointsPerInterval.set(Permission.BROADCASTER, 2);
pointsPerInterval.set(Permission.OWNER, 2);

interface Chatter {
  permission: Permission;
  points: number;
  acknowledged: boolean;
}

interface ChannelData {
  mainTimer?: NodeJS.Timeout | number;
  resetTimer?: NodeJS.Timeout | number;
  watchTimer?: NodeJS.Timeout | number;
  chatters: { [twitchId: string]: Chatter };
}

const channelData: Map<string, ChannelData> = new Map();

const distributeWatchPoints = async (username: string) => {
  const promises: Array<Promise<any>> = [];
  const helixUsers = await getChatterHelixUsers();
  if (helixUsers) {
    helixUsers.forEach((user) => {
      // Don't give points to the bot
      if (user.name === process.env.TWITCH_USERNAME) return;

      promises.push(
        addPoints({ channel: username, twitchId: user.id }, watchMultiplier)
      );
    });

    return Promise.all(promises);
  }
};

const distributeChatPoints = (username: string) => {
  const promises: Array<Promise<any>> = [];
  for (const twitchId in chatters) {
    promises.push(
      addPoints(
        { twitchId },
        chatMultiplier *
          chatters[twitchId].points *
          chatters[twitchId].points *
          (pointsPerInterval.get(chatters[twitchId].permission) || 1)
      )
    );
  }

  chatters = {};
  return Promise.all(promises);
};

const getOrCreateChatter = (
  username: string,
  twitchId: string,
  permission: Permission
) => {
  if (chatters[twitchId]) return chatters[twitchId];

  const chatter: Chatter = { permission, points: 0, acknowledged: false };
  chatters[twitchId] = chatter;
  return chatter;
};

const resetAcknowledgements = (username: string) => {
  twitchBotLogger.info("Resetting acknowledgements...");
  for (const twitchId in chatters) {
    chatters[twitchId].acknowledged = false;
  }
};

const distributePoints = async (username: string) => {
  if (process.env.NODE_ENV !== "development" && !(await isBroadcasterLive()))
    return;

  twitchBotLogger.info("Distributing points...");
  await distributeWatchPoints(username);
  await distributeChatPoints(username);
};

const distibuteWatchTime = async (username: string) => {
  if (process.env.NODE_ENV !== "development" && !(await isBroadcasterLive()))
    return;

  twitchBotLogger.info("Distributing watch time...");

  const helixUsers = await getChatterHelixUsers();
  if (helixUsers) {
    helixUsers.forEach((user) => {
      // Don't give points to the bot
      if (user.name === process.env.TWITCH_USERNAME) return;

      addWatchTime({ channel: username, twitchId: user.id }, watchTimeInterval);
    });
  }
};

let mainTimer: NodeJS.Timeout;
let chatResetTimer: NodeJS.Timeout;
let watchTimeTimer: NodeJS.Timeout;
export const setupPassivePointTimer = () => {
  if (mainTimer) clearInterval(mainTimer);
  mainTimer = setInterval(distributePoints, timerInterval * 60 * 1000);

  if (chatResetTimer) clearInterval(chatResetTimer);
  chatResetTimer = setInterval(
    resetAcknowledgements,
    acknowledgeResetInterval * 60 * 1000
  );

  if (watchTimeTimer) clearInterval(watchTimeTimer);
  watchTimeTimer = setInterval(
    distibuteWatchTime,
    watchTimeInterval * 60 * 1000
  );
};

export const acknowledgeChatter = (
  twitchId: string,
  permission: Permission
) => {
  const chatter = getOrCreateChatter(twitchId, permission);

  if (!chatter.acknowledged) {
    twitchBotLogger.info(`Acknowledging chatter: ${twitchId}, ${permission}`);
    chatter.acknowledged = true;
    chatter.points++;
  }
};

// Add global link black/whitelisting system !url allow/block (all urls besides some hard coded urls/domains blacklisted by default)
