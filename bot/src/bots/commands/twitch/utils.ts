import twitchCommandHandler from "../TwitchCommandHandler";
import Command from "../Command";
import { CommandArguments } from "../Command";
import { Permission } from "../CommandHandler";

twitchCommandHandler.registerCommand(
  new Command({
    permission: Permission.USER,
    aliases: ["followage", "fa"],
    args: [{ arg: CommandArguments.USER, name: "user", optional: true }],
    callback: async (caller, _channel, _alias, data, bot) => {
      const [user] = data as [string | undefined];

      console.log(user);
    },
  })
);
