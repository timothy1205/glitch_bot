import assert from "assert";
import mongoose from "mongoose";
import CommandHandler from "../bots/commands/CommandHandler";
import { mongooseLogger } from "../logging";
import { addAutoMessage } from "./../auto_messages";
import { RegisterError } from "./../bots/commands/CommandHandler";
import { getMongoStaticCommands } from "./staticCommands";

const registerStaticCommands = async () => {
  mongooseLogger.info("Registering static commands stored in MongoDB!");

  const staticCommands = await getMongoStaticCommands();

  staticCommands.forEach((cmd) => {
    try {
      CommandHandler.registerStaticCommand(cmd.aliases, cmd.message);

      if (cmd.auto) {
        addAutoMessage(cmd.message);
      }
    } catch (error) {
      if (error instanceof RegisterError) {
        mongooseLogger.warn(
          `Failed to register static command: ${cmd.aliases} ${cmd.aliases}`
        );
      }
    }
  });
};

assert.ok(process.env.MONGO_URL);

mongoose.connect(process.env.MONGO_URL);

export const connection = mongoose.connection;

connection.on("error", (err) => mongooseLogger.error(err));

connection.on("open", async () => {
  mongooseLogger.info(
    `Successfully connected to MongoDB (${process.env.MONGO_URL})`
  );
  registerStaticCommands();
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
