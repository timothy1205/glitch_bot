import { isBroadcasterLive, getChannelChatters, twitchAPI } from "./twitch_api";
import { Permission } from "./bots/commands/CommandHandler";
import { addPoints } from "./mongo/user";

// TODO: Add commands to blacklist users (bots) from recieving points.
// Save to mongo and pull all users on startup

const timerInterval = 20 * 60 * 1000;
const acknowledgeResetInterval = 5 * 60 * 1000;
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
let chatters: { [twitchId: string]: Chatter } = {};

const distributeWatchPoints = async () => {
  const names = (await getChannelChatters()).allChatters;
  if (names.length < 0) return 0;

  (await twitchAPI.helix.users.getUsersByNames(names)).forEach((user) => {
    // Don't give points to the bot
    if (user.name === process.env.TWITCH_USERNAME) return;

    addPoints({ twitchId: user.id }, watchMultiplier);
  });
};

const distributeChatPoints = () => {
  for (const twitchId in chatters) {
    addPoints(
      { twitchId },
      chatMultiplier *
        chatters[twitchId].points *
        chatters[twitchId].points *
        (pointsPerInterval.get(chatters[twitchId].permission) || 1)
    );
  }

  chatters = {};
};

const getOrCreateChatter = (twitchId: string, permission: Permission) => {
  if (chatters[twitchId]) return chatters[twitchId];

  const chatter: Chatter = { permission, points: 0, acknowledged: false };
  chatters[twitchId] = chatter;
  return chatter;
};

const resetAcknowledgements = () => {
  for (const twitchId in chatters) {
    chatters[twitchId].acknowledged = false;
  }
};

const distributePoints = async () => {
  if (!(await isBroadcasterLive())) return;

  distributeWatchPoints();
  distributeChatPoints();
};

let mainTimer: NodeJS.Timeout;
let chatResetTimer: NodeJS.Timeout;
export const setupPassivePointTimer = () => {
  if (mainTimer) clearInterval(mainTimer);
  mainTimer = setInterval(distributePoints, timerInterval);

  if (chatResetTimer) clearInterval(chatResetTimer);
  chatResetTimer = setInterval(resetAcknowledgements, acknowledgeResetInterval);
};

export const acknowledgeChatter = (
  twitchId: string,
  permission: Permission
) => {
  const chatter = getOrCreateChatter(twitchId, permission);

  if (!chatter.acknowledged) {
    chatter.acknowledged = true;
    chatter.points++;
  }
};
