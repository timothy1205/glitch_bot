import twitchBot from "../../TwitchBot";
import { twitchAPI } from "../../../twitch_api";
import Command, { CommandArguments } from "../Command";
import { Permission } from "../CommandHandler";

twitchBot.getCommandHandler()?.registerCommand(
  new Command({
    permission: Permission.OWNER,
    aliases: ["twitchinfo"],
    args: [
      { arg: CommandArguments.STRING, name: "id" },
      { arg: CommandArguments.STRING, name: "type", optional: true },
    ],
    callback: async (caller, _channel, _alias, data, _bot) => {
      let helixUser;
      const [id, type] = data as [string, string | undefined];

      try {
        if (!type || type === "id") {
          helixUser = await twitchAPI.helix.users.getUserById(id);
        } else if (type === "name") {
          helixUser = await twitchAPI.helix.users.getUserByName(id);
        }
      } catch (error) {}

      if (!helixUser) {
        twitchBot.reply(caller, "no user found!");
      } else {
        twitchBot.reply(
          caller,
          `Name: ${helixUser.name}, DisplayName: ${helixUser.displayName}, ID: ${helixUser.id} ${helixUser.type}, Views: ${helixUser.views}`
        );
      }
    },
  })
);
