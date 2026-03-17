import winston from "winston";
import morgan from "morgan";

export const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
    ],
});

export const morganMiddleware = morgan(
    ":method :url :status :res[content-length] - :response-time ms",
    {
        stream: {
            write: (message) => logger.info(message.trim()),
        },
    }
);
