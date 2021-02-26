import { removeAutoMessage } from "./../auto_messages";
import StaticCommandModel from "./models/StaticCommandModel";

export const getMongoStaticCommands = (channel: string) => {
  return StaticCommandModel.find({ channel });
};

export const getMongoStaticCommand = (channel: string, alias: string) => {
  return StaticCommandModel.findOne({ channel, aliases: alias });
};

export const setMongoStaticCommand = async (
  channel: string,
  aliases: string[],
  message: string
) => {
  const staticCommand = new StaticCommandModel();
  staticCommand.channel = channel;
  staticCommand.aliases = aliases;
  staticCommand.message = message;

  await staticCommand.save();
};

export const deleteMongoStaticCommand = async (
  channel: string,
  alias: string
) => {
  const staticCommand = await getMongoStaticCommand(channel, alias);

  if (staticCommand) {
    removeAutoMessage(staticCommand.message);
    return staticCommand.deleteOne();
  }
};
