import Queue, { QueueNode } from "./Queue";
import { isBroadcasterLive } from "./twitch_api";
import channelManager from "./ChannelManager";

interface AutoMessageChannelData {
  timer?: NodeJS.Timeout | number;
  queue: Queue;
  ignoreCount: number;
}
const channelData: { [channel: string]: AutoMessageChannelData } = {};

// TODO: Make config options
const timerInterval = 20;
const maxMessageIgnoreCount = 100;

export const aknowledgeMessage = (usernmae: string) => {
  channelData[usernmae].ignoreCount++;

  if (channelData[usernmae].ignoreCount >= maxMessageIgnoreCount) {
    setupAutoMessageTimerCount(usernmae);
    sendNextMessage(usernmae);
  }
};

export const addAutoMessage = (username: string, message: string) => {
  channelData[username].queue.enqueue(new QueueNode<string>(message));
};

export const removeAutoMessage = (username: string, message: string) => {
  channelData[username].queue.remove(message);
};

export const sendNextMessage = async (username: string) => {
  const queue = channelData[username].queue;

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
  if (!channelData[username]) {
    channelData[username] = {
      ignoreCount: 0,
      queue: new Queue(),
    };
  } else {
    channelData[username].ignoreCount = 0;
  }
};

const setupOrResetTimer = (username: string) => {
  const timer = channelData[username].timer;
  if (timer) clearInterval(timer as NodeJS.Timeout);
  channelData[username].timer = setInterval(
    sendNextMessage,
    timerInterval * 60 * 1000
  );
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
