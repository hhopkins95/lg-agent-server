// App Setup Imports
import packageJson from "../package.json" with { type: "json" };
import { configureAppOpenApi } from "./lib/hono/configure-app-openapi.ts";
import { createBaseApp, createRouter } from "./lib/hono/create-base-app.ts";
import { type AppRouterDef } from "./lib/hono/types.ts";
import { GRAPH_REGISTRY } from "./models/registry.ts";

// Router Imports
import type {
  GraphRouterGenerator,
  GraphServerProp,
  ServerConfig,
} from "./types.ts";
import { assistantsRouter } from "./routers/assistants/assistants.index.ts";
import { indexRouter } from "./routers/index.route.ts";
import { threadsRouter } from "./routers/threads/threads.index.ts";

/**
 * ROUTERS
 */
const BASE_ROUTERS: AppRouterDef[] = [
  indexRouter,
]; // base routes

const GRAPH_ROUTERS: GraphRouterGenerator[] = [
  assistantsRouter,
  threadsRouter,
]; // routes particular to an agent

/**
 * CREATE SERVER
 */

import { type Annotation } from "@langchain/langgraph";
import { z } from "zod";

const CreateGraphServer = <
  TAnnotation extends ReturnType<typeof Annotation.Root<any>>,
  TSchema extends z.ZodType,
  TConfigAnnotation extends ReturnType<typeof Annotation.Root<any>>,
  TConfigSchema extends z.ZodType,
>(
  graphs: Array<
    GraphServerProp<TAnnotation, TSchema, TConfigAnnotation, TConfigSchema>
  >,
  config?: ServerConfig,
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
    GRAPH_REGISTRY.registerGraph(graph, config?.dataDir);

    // Create routes for this graph
    const agentRouter = createRouter();
    GRAPH_ROUTERS.forEach((graph_router) => {
      const { router, rootPath } = graph_router(graph);
      agentRouter.route(rootPath, router);
    });
    app.route(`/${graph.graph_name}`, agentRouter);
  }

  return app;
};

export default CreateGraphServer;
