import { model, Schema } from "mongoose";

interface StaticCommand {
  aliases: string[];
  message: string;
  auto: boolean;
}

const staticCommandSchema = new Schema<StaticCommand>({
  aliases: { type: Array(String), required: true },
  message: { type: String, required: true },
  auto: { type: Boolean, default: false },
});

export const StaticCommandModel = model<StaticCommand>(
  "static_command",
  staticCommandSchema
);
