// Typescript source mapping
require("source-map-support").install();

import "./mongo/mongoose";
import "./bots/commands/TwitchCommandHandler";
import "./bots/TwitchBot";
import CommandHandler from "./bots/commands/CommandHandler";
import { setupPassivePointTimer } from "./passive_stats";
import { setupAutoMessageTimerCount } from "./auto_messages";
import "./bots/commands";

CommandHandler.registerDefaultCommands();

setupPassivePointTimer();
setupAutoMessageTimerCount();
