import type { AppStorage } from "@/core/storage/types.ts";
import type { BaseCheckpointSaver } from "@langchain/langgraph";
import { Hono } from "hono";
import { createBaseApp } from "./lib/hono/create-base-app.ts";
import { GRAPH_REGISTRY } from "./registry.ts";
import { assistantsRouter } from "./routers/assistants.router.ts";
import { statelessRunsRouter } from "./routers/stateless-runs.router.ts";
import { threadsRouter } from "./routers/threads.router.ts";
import type { GraphServerConfiguration } from "./types.ts";
import type { MergeSchemaPath } from "hono/types";
import type { AppBindings } from "./lib/hono/types.ts";
import { mergeRoutes, type Module } from "./lib/hono/helpers.ts";

/**
 * Creates a new graph server with the specified graphs and configuration
 * @param graphConfig Array of graph definitions
 * @param config Optional server configuration
 * @returns Configured Hono app instance
 */
const createGraphServer = (
  graphConfig: GraphServerConfiguration, // TGraphDefs,
  appStorage?: AppStorage,
  checkpointer?: BaseCheckpointSaver,
) => {
  // Create hono app with middlewares, and configure the openapi doc routes

  // let graph_routers = []; // as const satisfies Module[];
  // // Register graphs and create routes
  // for (const gd of graphConfig) {
  //   // Register graph manager in registry -- will keep track of threads if in memory
  //   GRAPH_REGISTRY.registerGraphManager(gd, appStorage, checkpointer);

  //   // add routes to graph
  //   const graphRouter = new Hono()
  //     .route("/threads", threadsRouter(gd))
  //     .route("/assistants", assistantsRouter(gd))
  //     .route("/stateless-runs", statelessRunsRouter(gd));

  //   // type GraphRouterType =

  //   // add graph router to app
  //   graph_routers.push({
  //     path: gd.name,
  //     routes: graphRouter,
  //   });
  // }

  const app = new Hono<AppBindings>()
    .route("/threads", threadsRouter(graphConfig))
    .route("/assistants", assistantsRouter(graphConfig))
    .route("/stateless-runs", statelessRunsRouter(graphConfig));

  // const fin = [...graph_routers] as const satisfies Module[];

  // Build up the app with proper typing by chaining routers
  // const app = mergeRoutes(new Hono(), ...fin);

  type AppType = typeof app;

  return app;
};

export default createGraphServer;
