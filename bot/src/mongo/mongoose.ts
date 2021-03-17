import { addAutoMessage } from "./../auto_messages";
import { RegisterError } from "./../bots/commands/CommandHandler";
import { getMongoStaticCommands } from "./staticCommands";
import mongoose from "mongoose";
import { mongooseLogger } from "../logging";
import CommandHandler from "../bots/commands/CommandHandler";
import config from "../../config.json";
import channelManager from "../ChannelManager";

const registerStaticCommands = async (username: string) => {
  mongooseLogger.info(`Registering static commands for '${username}'`);

  const staticCommands = await getMongoStaticCommands(username);

  staticCommands.forEach((cmd) => {
    try {
      CommandHandler.registerStaticCommand(cmd.aliases, cmd.message);

      if (cmd.auto) {
        addAutoMessage(username, cmd.message);
      }
    } catch (error) {
      if (error instanceof RegisterError) {
        mongooseLogger.warn(
          `Failed to register static command for ${username}: ${cmd.aliases} ${cmd.message}`
        );
      }
    }
  });
};

mongoose.connect(config.mongo_url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

export const connection = mongoose.connection;

connection.on("error", (err) => mongooseLogger.error(err));

connection.on("open", async () => {
  mongooseLogger.info(
    `Successfully connected to MongoDB (${config.mongo_url})`
  );

  channelManager.channels.forEach(({ twitchConfig: { username } }) => {
    registerStaticCommands(username);
  });
});

if (process.env.NODE_ENV === "development") {
  mongoose.set(
    "debug",
    function (
      collectionName: string,
      methodName: string,
      ...methodArgs: any[]
    ) {
      mongooseLogger.info(
        `Mongoose: ${collectionName}.${methodName}(${JSON.stringify(
          methodArgs
        )})`
      );
    }
  );
}
