// Typescript source mapping
require("source-map-support").install();

import "./mongo/mongoose";
import TwitchCommandHandler from "./bots/commands/TwitchCommandHandler";
import TwitchBot from "./bots/TwitchBot";
import CommandHandler from "./bots/commands/CommandHandler";
import { setupPassivePointTimer } from "./passive_stats";
import "./bots/commands";

CommandHandler.registerDefaultCommands();

setupPassivePointTimer();
