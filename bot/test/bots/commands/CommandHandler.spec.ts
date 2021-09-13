import assert from "assert";
import winston from "winston";
import { Command, CommandArguments } from "../../../src/bots/commands/Command";
import {
  CommandHandler,
  Permission,
} from "../../../src/bots/commands/CommandHandler";
import { IBot } from "../../../src/bots/IBot";
import { IUser } from "../../../src/bots/IUser";

class TestCommandHandler extends CommandHandler {
  constructor() {
    super(
      winston.createLogger({
        transports: [new winston.transports.Console()],
      })
    );
  }
}

class TestUser extends IUser {
  public getID(): string {
    return "";
  }
}

class TestBot extends IBot {
  public async sendChannelMessage(
    _msg: string,
    _channel?: string
  ): Promise<any> {}
  public async reply(
    _user: IUser,
    _msg: string,
    _channel?: string
  ): Promise<any> {}
  public async privateMessage(_user: IUser, _msg: string): Promise<any> {}
}

describe("CommandHandler.ts", () => {
  describe("registerCommand", () => {
    const testCommandHandler = new TestCommandHandler();
    testCommandHandler.setBot(new TestBot());

    testCommandHandler.registerCommand(
      new Command({
        permission: Permission.MOD,
        aliases: ["test"],
        args: [
          { arg: CommandArguments.USER, name: "user" },
          {
            arg: CommandArguments.NUMBER,
            name: "number",
          },
          { arg: CommandArguments.STRING, name: "string" },
        ],
        callback: (caller, channel, alias, data, _bot) => {
          const [user, number, string] = data as [string, number, string];

          assert.strictEqual(caller.getUsername(), "test_user");
          assert.strictEqual(channel, "testChannel");
          assert.strictEqual(alias, "test");

          assert.strictEqual(user, "@someone");
          assert.strictEqual(number, 50);
          assert.strictEqual(string, "why, hello there");
        },
      })
    );

    const testUser = new TestUser();
    testUser.setUsername("test_user");
    testUser.setPermission(Permission.MOD);

    it("Hard command callback recieved all data", async () => {
      await testCommandHandler.handleMessage({
        user: testUser,
        channel: "testChannel",
        msg: "!test @someone 50 why, hello there",
      });
    });
  });
});
