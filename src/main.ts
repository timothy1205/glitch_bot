// Typescript source mapping
require("source-map-support").install();

import "./mongo/mongoose";
import TwitchBot from "./bots/TwitchBot";
import TwitchCommandHandler from "./bots/commands/TwitchCommandHandler";
import CommandHandler from "./bots/commands/CommandHandler";

// Start twitch chat bot client
export const twitchBot = new TwitchBot();
twitchBot.setCommandHandler(new TwitchCommandHandler(twitchBot));
twitchBot.connect();

import "./bots/commands";

CommandHandler.registerDefaultCommands();
