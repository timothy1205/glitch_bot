import Queue, { QueueNode } from "./Queue";
import { isBroadcasterLive } from "./twitch_api";
import channelManager from "./ChannelManager";

interface AutoMessageChannelData {
  timer?: NodeJS.Timeout | number;
  queue: Queue;
  ignoreCount: number;
}
const channelData: Map<string, AutoMessageChannelData> = new Map();

// TODO: Make config options
const timerInterval = 20;
const maxMessageIgnoreCount = 100;

export const aknowledgeMessage = (username: string) => {
  const data = channelData.get(username);
  if (!data) return;

  data.ignoreCount++;

  if (data.ignoreCount >= maxMessageIgnoreCount) {
    setupAutoMessageTimerCount(username);
    sendNextMessage(username);
  }
};

export const addAutoMessage = (username: string, message: string) => {
  const data = channelData.get(username);
  if (!data) return;

  data.queue.enqueue(new QueueNode<string>(message));
};

export const removeAutoMessage = (username: string, message: string) => {
  const data = channelData.get(username);
  if (!data) return;

  data.queue.remove(message);
};

export const sendNextMessage = async (username: string) => {
  const data = channelData.get(username);
  if (!data) return;

  const queue = data.queue;

  if (
    process.env.NODE_ENV !== "development" &&
    !(await isBroadcasterLive(username))
  )
    return;

  const messageNode = queue.dequeue() as QueueNode<string> | undefined;
  if (messageNode) {
    channelManager.twitchBot.sendChannelMessage(
      messageNode.getData(),
      username
    );
    queue.enqueue(messageNode);
  }
};

const setupOrResetData = (username: string) => {
  const data = channelData.get(username);

  if (!data) {
    channelData.set(username, {
      ignoreCount: 0,
      queue: new Queue(),
    });
  } else {
    data.ignoreCount = 0;
  }
};

const setupOrResetTimer = (username: string) => {
  const data = channelData.get(username);
  if (!data) return;

  const timer = data.timer;
  if (timer) clearInterval(timer as NodeJS.Timeout);
  data.timer = setInterval(sendNextMessage, timerInterval * 60 * 1000);
};

export const setupAutoMessageTimerCount = (username?: string) => {
  channelManager.miscLogger.info(
    "Starting/resetting twitch auto message timer and message count!"
  );

  if (username) {
    setupOrResetData(username);
  }
  for (let key in channelManager.channels) {
    const loopUsername = channelManager.channels[key].twitchConfig.username;
    setupOrResetData(loopUsername);
    setupOrResetTimer(loopUsername);
  }
};
