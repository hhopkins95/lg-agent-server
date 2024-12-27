// App Setup Imports
import packageJson from "../package.json" with { type: "json" };
import { configureAppOpenApi } from "./lib/hono/configure-app-openapi.ts";
import { createBaseApp, createRouter } from "./lib/hono/create-base-app.ts";
import { type AppRouterDef } from "./lib/hono/types.ts";
import { GRAPH_REGISTRY } from "./registry.ts";

// Router Imports
import type { TGraphDef } from "../core/types.ts";
import { assistantsRouter } from "./routers/assistants/assistants.index.ts";
import { indexRouter } from "./routers/index.route.ts";
import { threadsRouter } from "./routers/threads/threads.index.ts";
import type { GraphRouter, GraphServerConfiguration } from "./types.ts";
import type { BaseCheckpointSaver } from "@langchain/langgraph";

/**
 * ROUTERS
 */
const BASE_ROUTERS: AppRouterDef[] = [
  indexRouter,
]; // base routes

const GRAPH_ROUTERS: GraphRouter[] = [
  assistantsRouter,
  threadsRouter,
]; // routes particular to an agent

/**
 * Creates a new graph server with the specified graphs and configuration
 * @param graphs Array of graph definitions
 * @param config Optional server configuration
 * @returns Configured Hono app instance
 */
const CreateGraphServer = (
  graphs: GraphServerConfiguration[],
  checkpointer?: BaseCheckpointSaver,
) => {
  // Create hono app with middlewares, and configure the openapi doc routes
  const app = createBaseApp();
  configureAppOpenApi(app, {
    title: "Langgraph Agent Server",
    version: packageJson.version,
  });

  // Add routes that are not specific to a graph / agent
  for (const baseRoute of BASE_ROUTERS) {
    const { router, rootPath } = baseRoute;
    app.route(rootPath, router);
  }

  // Register graphs and create routes
  for (const graph of graphs) {
    // Register graph manager in registry
    GRAPH_REGISTRY.registerGraphManager(graph);

    // Create routes for this graph
    const agentRouter = createRouter();
    GRAPH_ROUTERS.forEach((graph_router) => {
      const { router, rootPath } = graph_router(graph);
      agentRouter.route(rootPath, router);
    });
    app.route(`/${graph.name}`, agentRouter);
  }

  return app;
};

export default CreateGraphServer;
