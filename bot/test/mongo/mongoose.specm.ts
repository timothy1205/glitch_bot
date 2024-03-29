import assert from "assert";
import mongoose from "mongoose";
import {
  addWatchTime,
  createUser,
  getOrCreateUser,
  getUser,
  setFollowed,
  setStatBanned,
} from "../../src/mongo/models/UserModel";

describe("Mongoose Tests", () => {
  before((done) => {
    mongoose.connect(
      `mongodb://localhost${
        process.env.MONGO_PORT ? ":" + process.env.MONGO_PORT : ""
      }/mongoose_test`,
      { serverSelectionTimeoutMS: 2500 }
    );

    mongoose.connection
      .on("error", () => {
        console.error("Failed to connect to database!");
      })
      .on("open", done);
  });

  after(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  });

  describe("UserModel.ts", () => {
    const opts = {
      twitchId: "1234567",
      discordId: "7654321",
    };
    describe("createUser", () => {
      it("All non-required data defaults properly", async () => {
        const user = await createUser(opts);

        assert.strictEqual(user.twitchId, opts.twitchId);
        assert.strictEqual(user.discordId, opts.discordId);
        assert.strictEqual(user.points, undefined);
        assert.strictEqual(user.minutesWatched, 0);
        assert.strictEqual(user.usedFollowNotification, false);
      });
    });

    describe("getUser", () => {
      it("Get by twitchId/discordId", async () => {
        assert.ok(await getUser({ twitchId: opts.twitchId }));
        assert.ok(await getUser({ discordId: opts.discordId }));
      });
    });

    describe("getOrCreateUser", () => {
      it("Get existing user", async () => {
        assert.ok(await getOrCreateUser(opts.twitchId));
      });

      it("Get non-existing user (create)", async () => {
        const twitchId = "1234567-2";
        const user = await getOrCreateUser(twitchId);

        assert.strictEqual(user.twitchId, twitchId);
      });
    });

    describe("addWatchTime", () => {
      it("Add time to existing user", async () => {
        const time = 5;
        assert.strictEqual(
          await addWatchTime({ twitchId: opts.twitchId }, time),
          5
        );
        const user = await getUser({ twitchId: opts.twitchId });
        assert.ok(user);
        assert.strictEqual(user.minutesWatched, time);
      });

      it("Add time to non-existing user", async () => {
        const time = 5;
        const twitchId = "1234567-2";

        assert.strictEqual(await addWatchTime({ twitchId }, time), time);
        const user = await getUser({ twitchId });
        assert.ok(user);
        assert.strictEqual(user.minutesWatched, time);

        await user.delete();
      });
    });

    describe("setStatBanned", () => {
      it("Stat ban value saved and retrieved by subsequent getUser", async () => {
        let user = await getUser({ twitchId: opts.twitchId });
        assert.ok(user);

        const currentStatBanned = user.statBanned;

        await setStatBanned(opts.twitchId, !currentStatBanned);
        user = await getUser({ twitchId: opts.twitchId });
        assert.ok(user);
        assert.strictEqual(user.statBanned, !currentStatBanned);
      });
    });

    describe("setFollowed", () => {
      it("setFollow with no date input", async () => {
        const twitchId = "1234567-3";

        await setFollowed({ twitchId });
        const user = await getUser({ twitchId });
        assert.ok(user);
        assert.strictEqual(user.usedFollowNotification, true);
        assert.ok(new Date().valueOf() - user.followDate.valueOf() < 5000);
      });
    });

    it("setFollow with custom date input", async () => {
      const twitchId = "1234567-3";
      const customDate = new Date();

      await setFollowed({ twitchId }, customDate);
      const user = await getUser({ twitchId });
      assert.ok(user);
      assert.strictEqual(user.usedFollowNotification, true);
      assert.strictEqual(user.followDate.valueOf(), customDate.valueOf());
    });
  });
});
