import { pinoLogger as log } from "hono-pino";
import { pino } from "pino";
import pretty from "pino-pretty";
import env from "../../constants/environment.ts";

const isProduction = env.NODE_ENV;
const logLevel = isProduction ? "info" : "debug";

export const pinoLogger = () =>
  log({
    pino: pino({
      level: logLevel,
    }, isProduction ? undefined : pretty()),
    http: {
      referRequestIdKey: crypto.randomUUID(),
    },
  });
