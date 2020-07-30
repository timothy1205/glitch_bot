// Typescript source mapping
require("source-map-support").install();

import "./mongo/mongoose";
import TwitchBot from "./bots/TwitchBot";
import TwitchCommandHandler from "./bots/commands/TwitchCommandHandler";

// Start twitch chat bot client
export const twitchBot = new TwitchBot();
twitchBot.setCommandHandler(new TwitchCommandHandler(twitchBot));
twitchBot.connect();

import "./bots/commands";
