import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const createDailyTransport = (fileDir: string) => {
  return new DailyRotateFile({
    filename: `logs/${fileDir}/%DATE%.log`,
    datePattern: "YYYY-MM-DD-HH",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d",
  });
};

export const createLogger = (fileDir: string) => {
  const dailyTransport = createDailyTransport(fileDir);

  return winston.createLogger({
    level: process.env.LOG_LEVEL,
    format: winston.format.combine(
      winston.format.errors({ stack: true }),
      winston.format.timestamp(),
      winston.format.prettyPrint()
    ),
    transports: [new winston.transports.Console(), dailyTransport],
  });
};

export const mongooseLogger = winston.createLogger({
  level: process.env.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.timestamp(),
    winston.format.prettyPrint()
  ),
  transports: [
    new winston.transports.Console(),
    createDailyTransport("mongoose"),
  ],
});
