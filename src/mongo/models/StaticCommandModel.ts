import { createSchema, Type, typedModel } from "ts-mongoose";

const StaticCommandSchema = createSchema({
  aliases: Type.array({ required: true }).of(Type.string({ required: true })),
  message: Type.string({ required: true }),
});

const StaticCommandModel = typedModel("static_command", StaticCommandSchema);
export default StaticCommandModel;
