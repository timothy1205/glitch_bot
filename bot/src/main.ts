// Typescript source mapping
require("source-map-support").install();

import assert from "assert";
import config from "../config.json";

validateConfig();

import "./mongo/mongoose";
import TwitchCommandHandler from "./bots/commands/TwitchCommandHandler";
import TwitchBot from "./bots/TwitchBot";
import CommandHandler from "./bots/commands/CommandHandler";
import { setupPassivePointTimer } from "./passive_stats";
import { setupAutoMessageTimerCount } from "./auto_messages";
import "./bots/commands";

CommandHandler.registerDefaultCommands();

setupPassivePointTimer();
setupAutoMessageTimerCount();

function validateConfig() {
  assert(typeof config.mongo_url === "string");
  assert(typeof config.owner_id === "string");
  assert(typeof config.twitch_username === "string");
  assert(typeof config.tmi_oauth_token === "string");
  assert(typeof config.twitch_client_id === "string");
  assert(typeof config.twitch_client_secret === "string");
  assert(typeof config.channels === "object");

  config.channels.forEach((channel) => {
    assert(typeof channel.username === "string");
    assert(typeof channel.currency_name === "string");
    assert(
      typeof channel.currency_name_plural === "string" ||
        typeof channel.currency_name_plural === "undefined"
    );
    assert(typeof channel.currency_emoji === "string");
  });
}
