import type { OpenAPIHono, RouteConfig, RouteHandler } from "@hono/zod-openapi";
import type { PinoLogger } from "hono-pino";

/**
 * Custom additions to the context that is passed to each route
 */
export interface AppBindings {
  Variables: {
    logger: PinoLogger;
  };
}

/** */
export type AppOpenApi = OpenAPIHono<AppBindings>;

/**
 * Helper type for creating routes. Automatically adds the AppBindings
 */
export type AppRouteHandler<R extends RouteConfig> = RouteHandler<
  R,
  AppBindings
>;

/**
 * Definition for exporting a router
 */
export type AppRouterDef = {
  router: AppOpenApi;
  rootPath: string;
};
