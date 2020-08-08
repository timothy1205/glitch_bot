import { createSchema, Type, typedModel } from "ts-mongoose";

const userSchema = createSchema({
  twitchId: Type.string({ required: true }),
  discordId: Type.string(),
  points: Type.number({ default: 0 }),
  usedFollowNotification: Type.boolean({ default: false }),
});

const UserModel = typedModel("user", userSchema);
export default UserModel;
