import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

let twitchBotDailyTransport = new DailyRotateFile({
  filename: "logs/bots/twitch/%DATE%.log",
  datePattern: "YYYY-MM-DD-HH",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
});

export const twitchBotLogger = winston.createLogger({
  level: process.env.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.prettyPrint()
  ),
  transports: [new winston.transports.Console(), twitchBotDailyTransport],
});

let mongooseDailyTransport = new DailyRotateFile({
  filename: "logs/mongoose/%DATE%.log",
  datePattern: "YYYY-MM-DD-HH",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
});

export const mongooseLogger = winston.createLogger({
  level: process.env.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.prettyPrint()
  ),
  transports: [new winston.transports.Console(), mongooseDailyTransport],
});
