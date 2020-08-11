import mongoose from "mongoose";
import { mongooseLogger } from "../logging";

mongoose.connect("mongodb://mongo:27017/glitch_bot", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

export const connection = mongoose.connection;

connection.on("error", (err) => mongooseLogger.error(err));

connection.on("open", async () => {
  mongooseLogger.info("Successfully connected to MongoDB!");
});

if (process.env.NODE_ENV === "development") {
  mongoose.set("debug", function (
    collectionName: string,
    methodName: string,
    ...methodArgs: any[]
  ) {
    mongooseLogger.info(
      `Mongoose: ${collectionName}.${methodName}(${JSON.stringify(methodArgs)})`
    );
  });
}
