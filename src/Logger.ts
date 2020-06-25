import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

let dailyRotateTransport = new DailyRotateFile({
  filename: "logs/%DATE%.log",
  datePattern: "YYYY-MM-DD-HH",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.prettyPrint()
  ),
  transports: [new winston.transports.Console(), dailyRotateTransport],
});
