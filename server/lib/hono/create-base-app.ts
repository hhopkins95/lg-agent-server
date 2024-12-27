import { OpenAPIHono } from "@hono/zod-openapi";
import notFound from "./middlewares/not-found.ts";
import { onError } from "./middlewares/on-error.ts";
import { pinoLogger } from "./middlewares/pino-logger.ts";
import serveEmojiFavicon from "./middlewares/serve-emoji-favicon.ts";
import type { AppBindings } from "./types.ts";
import { Hono } from "hono";

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
