import { removeAutoMessage } from "./../auto_messages";
import { StaticCommandModel } from "./models/StaticCommandModel";

export const getMongoStaticCommands = () => {
  return StaticCommandModel.find({});
};

export const getMongoStaticCommand = (alias: string) => {
  return StaticCommandModel.findOne({ aliases: alias });
};

export const setMongoStaticCommand = async (
  aliases: string[],
  message: string
) => {
  const staticCommand = new StaticCommandModel();
  staticCommand.aliases = aliases;
  staticCommand.message = message;

  await staticCommand.save();
};

export const deleteMongoStaticCommand = async (alias: string) => {
  const staticCommand = await getMongoStaticCommand(alias);

  if (staticCommand) {
    removeAutoMessage(staticCommand.message);
    return staticCommand.deleteOne();
  }
};
