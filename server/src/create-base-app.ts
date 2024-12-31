import { Hono } from "hono";
import notFound from "./lib/hono/middlewares/not-found.ts";
import { onError } from "./lib/hono/middlewares/on-error.ts";
import { pinoLogger } from "./lib/hono/middlewares/pino-logger.ts";
import serveEmojiFavicon from "./lib/hono/middlewares/serve-emoji-favicon.ts";
import type { AppBindings } from "./lib/hono/types.ts";

/**
 * Creates a hono app with default middlewares and configs
 */
export const createBaseApp = () => {
  const app = new Hono<AppBindings>();

  // Middlewares
  app.use(pinoLogger()); // TODO -- customize logger
  app.use(serveEmojiFavicon("🤖"));

  // TODO -- look through these middlewares and customize. currently come from 'stoker'
  app.onError(onError);
  app.notFound(notFound);

  return app;
};
