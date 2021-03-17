import { createSchema, Type, typedModel } from "ts-mongoose";

const userSchema = createSchema({
  twitchChannel: Type.string({ required: true }),
  twitchId: Type.string({ required: true }),
  discordId: Type.string(),
  points: Type.number({ default: 0 }),
  minutesWatched: Type.number({ default: 0 }),
  usedFollowNotification: Type.boolean({ default: false }),
  followDate: Type.date({ required: false }),
  statBanned: Type.boolean({ default: false }),
});

const UserModel = typedModel("user", userSchema);
export default UserModel;

type IDTwitchOrDiscord =
  | ({ twitchChannel: string } & { twitchId: string })
  | { discordId: string };
type TwitchIDOrUser =
  | ({ twitchChannel: string } & { twitchId: string })
  | { user: typeof UserModel };

export const getUser = (id: IDTwitchOrDiscord) => {
  return UserModel.findOne(id);
};

interface UserCreateOptions {
  channel: string;
  twitchId: string;
  discordId?: string;
  points?: number;
}

export const createUser = async (opt: UserCreateOptions) => {
  const user = new UserModel();
  user.channel = opt.channel;
  user.twitchId = opt.twitchId;
  user.discordId = opt.discordId;
  user.points = opt.points;
  await user.save();

  return user;
};

export const getOrCreateUser = async (channel: string, twitchId: string) => {
  const user = await getUser({ twitchChannel: channel, twitchId });
  if (user) return user;
  else return createUser({ channel, twitchId });
};

export const getPoints = async (id: IDTwitchOrDiscord) => {
  const user = await getUser(id);
  if (user === null) return;

  return user.points || 0;
};

export class InvalidPointsError extends Error {}

export const setPoints = async (id: IDTwitchOrDiscord, points: number) => {
  points = Math.round(points);
  if (points < 0) throw new InvalidPointsError("cannot have negative points");
  // Can only have 0 points
  if (await getStatBanned(id)) points = 0;

  return UserModel.updateOne(id, { points });
};

export const addPoints = async (id: IDTwitchOrDiscord, points: number) => {
  const current = await getPoints(id);
  if (current === undefined && "twitchId" in id) {
    // No user found and we are working with twitch => create user
    await createUser(Object.assign(id, { points }));
    return points;
  }

  const sum = (current || 0) + points;
  await setPoints(id, sum);
  return sum;
};

export const getTopPoints = (username: string) => {
  return UserModel.find({ twitchChannel: username })
    .sort({ points: -1 })
    .limit(5);
};

export const resetAllPoints = (username: string) => {
  return UserModel.updateMany({ twitchChannel: username }, { points: 0 });
};

export const getWatchTime = async (id: IDTwitchOrDiscord) => {
  return (await UserModel.findOne(id))?.minutesWatched;
};

export const setWatchTime = async (id: IDTwitchOrDiscord, minutes: number) => {
  minutes = Math.round(minutes);
  if (minutes < 0) throw new InvalidPointsError("cannot have negative time");

  // Can only have 0 points
  if (await getStatBanned(id)) minutes = 0;

  return UserModel.updateOne(id, { minutesWatched: minutes });
};

export const addWatchTime = async (id: IDTwitchOrDiscord, minutes: number) => {
  const current = await getWatchTime(id);
  if (current === undefined && "twitchId" in id) {
    // No user found and we are working with twitch => create user
    await createUser(Object.assign(id, { points: minutes }));
    return minutes;
  }

  const sum = (current || 0) + minutes;
  await setWatchTime(id, sum);
  return sum;
};

export const getStatBanned = async (id: IDTwitchOrDiscord) => {
  return (await UserModel.findOne(id))?.statBanned;
};

export const setStatBanned = async (
  username: string,
  twitchId: string,
  val: boolean
) => {
  const user = await getOrCreateUser(username, twitchId);
  user.statBanned = val;
  await user.save();
};

export const setFollowed = async (
  idOrUser: TwitchIDOrUser,
  date: Date = new Date()
) => {
  let user;
  if ("twitchId" in idOrUser) {
    user = await getOrCreateUser(idOrUser.twitchChannel, idOrUser.twitchId);
  } else {
    user = idOrUser.user;
  }

  user.usedFollowNotification = true;
  user.followDate = date;
  await user.save();
};
