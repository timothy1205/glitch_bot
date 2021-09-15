import { twitchBot } from "../../TwitchBot";
import { twitchAPI } from "../../../twitch_api";
import {
  CommandCategories,
  CommandHCGeneric,
  CommandArguments,
} from "../Command";
import { Permission } from "../CommandHandler";

const FILE_CATEGORY = CommandCategories.TWITCH_ADMIN;

twitchBot.getCommandHandler()?.registerCommand(
  new CommandHCGeneric<[string, string | undefined]>({
    permission: Permission.OWNER,
    aliases: ["twitchinfo"],
    args: [
      { arg: CommandArguments.STRING, name: "id" },
      { arg: CommandArguments.STRING, name: "type", optional: true },
    ],
    category: FILE_CATEGORY,
    callback: async (caller, _channel, _alias, data, _bot) => {
      let helixUser;
      const [id, type] = data;

      if (!type || type === "id") {
        helixUser = await twitchAPI.users.getUserById(id);
      } else if (type === "name") {
        helixUser = await twitchAPI.users.getUserByName(id);
      }

      if (!helixUser) {
        twitchBot.reply(caller, "no user found!");
      } else {
        twitchBot.reply(
          caller,
          `Name: ${helixUser.name}, Display Name: ${helixUser.displayName}, ID: ${helixUser.id} ${helixUser.type}, Views: ${helixUser.views}`
        );
      }
    },
  })
);
