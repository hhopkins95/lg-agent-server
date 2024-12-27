// App Setup Imports
import { createBaseApp } from "./lib/hono/create-base-app.ts";
import { GRAPH_REGISTRY } from "./registry.ts";

// Router Imports
import type { BaseCheckpointSaver } from "@langchain/langgraph";
import { assistantsRouter } from "./routers/assistants/assistants.index.ts";
import { threadsRouter } from "./routers/threads/threads.index.ts";
import type { GraphRouter, GraphServerConfiguration } from "./types.ts";
import { Hono } from "hono";
import type { AppStorage } from "@/core/storage/types.ts";
import { statelessRunsRouter } from "./routers/stateless-runs.router.ts";

/**
 * Creates a new graph server with the specified graphs and configuration
 * @param graphDefs Array of graph definitions
 * @param config Optional server configuration
 * @returns Configured Hono app instance
 */
const CreateGraphServer = (
  graphDefs: GraphServerConfiguration[],
  appStorage?: AppStorage,
  checkpointer?: BaseCheckpointSaver,
) => {
  // Create hono app with middlewares, and configure the openapi doc routes
  const app = createBaseApp();

  // Add base routes
  // app.route("/", indexRouter);

  // Register graphs and create routes
  for (const gd of graphDefs) {
    // Register graph manager in registry -- will keep track of threads if in memory
    GRAPH_REGISTRY.registerGraphManager(gd, appStorage, checkpointer);

    // add routes to graph
    const graphRouter = new Hono();
    graphRouter.route("/assistants", assistantsRouter(gd));
    graphRouter.route("/threads", threadsRouter(gd));
    graphRouter.route("/stateless-runs", statelessRunsRouter(gd));

    // add graph router to app
    app.route(`/${gd.name}`, graphRouter);
  }

  return app;
};

export default CreateGraphServer;
