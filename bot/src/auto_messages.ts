import { twitchBotLogger } from "./logging";
import { Queue, QueueNode } from "./Queue";
import { twitchBot } from "./bots/TwitchBot";
import { isBroadcasterLive } from "./twitch_api";

const timerInterval = 20;
const maxMessageIgnoreCount = 100;

const messageQueue = new Queue();

let messageIgnoreCount = 0;
export const aknowledgeMessage = () => {
  messageIgnoreCount++;

  if (messageIgnoreCount >= maxMessageIgnoreCount) {
    setupAutoMessageTimerCount();
    sendNextMessage();
  }
};

export const addAutoMessage = (message: string) => {
  messageQueue.enqueue(new QueueNode<string>(message));
};

export const removeAutoMessage = (message: string) => {
  messageQueue.remove(message);
};

export const sendNextMessage = async () => {
  if (process.env.NODE_ENV !== "development" && !(await isBroadcasterLive()))
    return;

  const messageNode = messageQueue.dequeue() as QueueNode<string> | undefined;
  if (messageNode) {
    twitchBot.sendChannelMessage(messageNode.getData());
    messageQueue.enqueue(messageNode);
  }
};

let mainTimer: NodeJS.Timeout;
export const setupAutoMessageTimerCount = () => {
  twitchBotLogger.info(
    "Starting/resetting twitch auto message timer and message count!"
  );

  if (mainTimer) clearInterval(mainTimer);
  mainTimer = setInterval(sendNextMessage, timerInterval * 60 * 1000);
  messageIgnoreCount = 0;
};
