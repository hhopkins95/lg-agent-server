import type { Hono } from "hono";
import type { PinoLogger } from "hono-pino";

/**
 * Custom additions to the context that is passed to each route
 */
export interface AppBindings {
  Variables: {
    logger: PinoLogger;
  };
}
