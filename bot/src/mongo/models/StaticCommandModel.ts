import { createSchema, Type, typedModel } from "ts-mongoose";
import { QueryCursor } from "mongoose";

const StaticCommandSchema = createSchema({
  aliases: Type.array({ required: true }).of(Type.string({ required: true })),
  message: Type.string({ required: true }),
  auto: Type.boolean({ default: false }),
});

const StaticCommandModel = typedModel("static_command", StaticCommandSchema);
export default StaticCommandModel;
