import StaticCommandModel from "./models/StaticCommandModel";

export const getMongoStaticCommands = () => {
  return StaticCommandModel.find({});
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
  StaticCommandModel.deleteOne({ aliases: alias });
};
