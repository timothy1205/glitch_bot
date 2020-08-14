import { createSchema, Type, typedModel } from "ts-mongoose";

const userSchema = createSchema({
  twitchId: Type.string({ required: true }),
  discordId: Type.string(),
  points: Type.number({ default: 0 }),
  usedFollowNotification: Type.boolean({ default: false }),
});

const UserModel = typedModel("user", userSchema);
export default UserModel;

type IDTwitchOrDiscord = { twitchId: string } | { discordId: string };

export const getUser = (id: IDTwitchOrDiscord) => {
  return UserModel.findOne(id);
};

interface UserCreateOptions {
  twitchId: string;
  discordId?: string;
  points?: number;
}

export const createUser = async (opt: UserCreateOptions) => {
  const user = new UserModel();
  user.twitchId = opt.twitchId;
  user.discordId = opt.discordId;
  user.points = opt.points;
  await user.save();

  return user;
};

export const getOrCreateUser = async (twitchId: string) => {
  const user = await getUser({ twitchId });
  if (user) return user;
  else return createUser({ twitchId });
};

export const getPoints = async (id: IDTwitchOrDiscord) => {
  const user = await getUser(id);
  if (user === null) return;

  return user.points || 0;
};

export class InvalidPointsError extends Error {}

export const setPoints = (id: IDTwitchOrDiscord, points: number) => {
  points = Math.round(points);
  if (points < 0) throw new InvalidPointsError("cannot have negative points");
  return UserModel.updateOne(id, { points });
};

export const addPoints = async (id: IDTwitchOrDiscord, points: number) => {
  const current = await getPoints(id);
  if (current === undefined && "twitchId" in id) {
    // No user found and we are working with twitch => create user
    await createUser({ twitchId: id.twitchId, points });
    return points;
  }

  const sum = (current || 0) + points;
  await setPoints(id, sum);
  return sum;
};

export const getTopPoints = () => {
  return UserModel.find().sort({ points: -1 });
};

export const resetAllPoints = () => {
  return UserModel.updateMany({}, { points: 0 });
};
