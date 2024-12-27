// App Setup Imports
import { createBaseApp } from "./lib/hono/create-base-app.ts";
import { GRAPH_REGISTRY } from "./registry.ts";

// Router Imports
import type { BaseCheckpointSaver } from "@langchain/langgraph";
import { assistantsRouter } from "./routers/assistants/assistants.index.ts";
import { threadsRouter } from "./routers/threads/threads.index.ts";
import type { GraphRouter, GraphServerConfiguration } from "./types.ts";
import { indexRouter } from "./routers/index.route.ts";
import { Hono } from "hono";
import type { AppStorage } from "@/core/storage/types.ts";
import { statelessRunsRouter } from "./routers/stateless-runs.ts";

/**
 * Creates a new graph server with the specified graphs and configuration
 * @param graphs Array of graph definitions
 * @param config Optional server configuration
 * @returns Configured Hono app instance
 */
const CreateGraphServer = (
  graphs: GraphServerConfiguration[],
  appStorage?: AppStorage,
  checkpointer?: BaseCheckpointSaver,
) => {
  // Create hono app with middlewares, and configure the openapi doc routes
  const app = createBaseApp();

  // Add base routes
  app.route("/", indexRouter);

  // Register graphs and create routes
  for (const graph of graphs) {
    // Register graph manager in registry -- will keep track of threads if in memory
    GRAPH_REGISTRY.registerGraphManager(graph, appStorage, checkpointer);
    const graphRouter = new Hono();

    // add routes
    graphRouter.route("/assistants", assistantsRouter(graph));
    graphRouter.route("/threads", threadsRouter(graph));
    graphRouter.route("/stateless-runs", statelessRunsRouter(graph));

    app.route(`/${graph.name}`, graphRouter);
  }

  return app;
};

export default CreateGraphServer;
