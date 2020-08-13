// Typescript source mapping
require("source-map-support").install();

import "./mongo/mongoose";
import TwitchBot from "./bots/TwitchBot";
import TwitchCommandHandler from "./bots/commands/TwitchCommandHandler";
import CommandHandler from "./bots/commands/CommandHandler";
import { setupPassivePointTimer } from "./passive_points";
import "./bots/commands";

CommandHandler.registerDefaultCommands();

setupPassivePointTimer();
