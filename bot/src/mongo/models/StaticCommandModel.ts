import { createSchema, Type, typedModel } from "ts-mongoose";

const StaticCommandSchema = createSchema({
  channel: Type.string({ required: true }),
  aliases: Type.array({ required: true }).of(Type.string({ required: true })),
  message: Type.string({ required: true }),
  auto: Type.boolean({ default: false }),
});

const StaticCommandModel = typedModel("static_command", StaticCommandSchema);
export default StaticCommandModel;
