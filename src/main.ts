// Typescript source mapping
require("source-map-support").install();
const path = require("path");

// Setup environmental variables
require("dotenv").config({ path: path.join(path.dirname(__dirname), ".env") });

import TwitchBot from "./bots/TwitchBot";
import TwitchCommandHandler from "./bots/commands/TwitchCommandHandler";

// Start twitch chat bot client
export const twitchBot = new TwitchBot();
twitchBot.setCommandHandler(new TwitchCommandHandler(twitchBot));
twitchBot.connect();
