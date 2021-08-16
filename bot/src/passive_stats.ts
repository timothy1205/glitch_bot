import { isBroadcasterLive, getChatterHelixUsers } from "./twitch_api";
import { twitchBotLogger } from "./logging";
import { addPoints, addWatchTime } from "./mongo/models/UserModel";

// Intervals in minutes
const timerInterval = 20;
const watchTimeInterval = 5;

const watchMultiplier = 4;

const distributeWatchPoints = async () => {
  const promises: Array<Promise<any>> = [];
  const helixUsers = await getChatterHelixUsers();
  if (helixUsers) {
    helixUsers.forEach((user) => {
      // Don't give points to the bot
      if (user.name === process.env.TWITCH_USERNAME) return;

      promises.push(addPoints({ twitchId: user.id }, watchMultiplier));
    });

    return Promise.all(promises);
  }
};

const distributePoints = async () => {
  if (process.env.NODE_ENV !== "development" && !(await isBroadcasterLive()))
    return;

  twitchBotLogger.info("Distributing points...");
  await distributeWatchPoints();
};

const distibuteWatchTime = async () => {
  if (process.env.NODE_ENV !== "development" && !(await isBroadcasterLive()))
    return;

  twitchBotLogger.info("Distributing watch time...");

  const helixUsers = await getChatterHelixUsers();
  if (helixUsers) {
    helixUsers.forEach((user) => {
      // Don't give points to the bot
      if (user.name === process.env.TWITCH_USERNAME) return;

      addWatchTime({ twitchId: user.id }, watchTimeInterval);
    });
  }
};

let mainTimer: NodeJS.Timeout;
let watchTimeTimer: NodeJS.Timeout;
export const setupPassivePointTimer = () => {
  if (mainTimer) clearInterval(mainTimer);
  mainTimer = setInterval(distributePoints, timerInterval * 60 * 1000);

  if (watchTimeTimer) clearInterval(watchTimeTimer);
  watchTimeTimer = setInterval(
    distibuteWatchTime,
    watchTimeInterval * 60 * 1000
  );
};
