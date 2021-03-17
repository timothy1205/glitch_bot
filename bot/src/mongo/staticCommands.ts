import { removeAutoMessage } from "./../auto_messages";
import StaticCommandModel from "./models/StaticCommandModel";

export const getMongoStaticCommands = (username: string) => {
  return StaticCommandModel.find({ twitchChannel: username });
};

export const getMongoStaticCommand = (username: string, alias: string) => {
  return StaticCommandModel.findOne({
    twitchChannel: username,
    aliases: alias,
  });
};

export const setMongoStaticCommand = async (
  username: string,
  aliases: string[],
  message: string
) => {
  const staticCommand = new StaticCommandModel();
  staticCommand.twitchChannel = username;
  staticCommand.aliases = aliases;
  staticCommand.message = message;

  await staticCommand.save();
};

export const deleteMongoStaticCommand = async (
  username: string,
  alias: string
) => {
  const staticCommand = await getMongoStaticCommand(username, alias);

  if (staticCommand) {
    removeAutoMessage(username, staticCommand.message);
    return staticCommand.deleteOne();
  }
};
