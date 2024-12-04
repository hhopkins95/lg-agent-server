import { OpenAPIHono } from "@hono/zod-openapi";
import notFound from "./middlewares/not-found.ts";
import { onError } from "./middlewares/on-error.ts";
import { pinoLogger } from "./middlewares/pino-logger.ts";
import serveEmojiFavicon from "./middlewares/serve-emoji-favicon.ts";
import type { AppBindings } from "./types.ts";
import defaultHook from "./openapi/default-hook.ts";

/**
 * Base method to create a router. App creates this, and then you mount other routers on to it
 */
export const createRouter = () => {
  return new OpenAPIHono<AppBindings>({
    strict: false,
    defaultHook, // Standard way of responding to zod validation errors on any route. TODO -- customize
  });
};

/**
 * Creates a hono app with default middlewares and configs
 */
export const createBaseApp = () => {
  const app = createRouter();

  // Middlewares
  app.use(pinoLogger()); // TODO -- customize logger
  app.use(serveEmojiFavicon("🤖"));

  // TODO -- look through these middlewares and customize. currently come from 'stoker'
  app.onError(onError);
  app.notFound(notFound);

  return app;
};
