import { Hono } from "hono";
import { assistantsRouter } from "./routers/assistants.router.ts";
import { statelessRunsRouter } from "./routers/stateless-runs.router.ts";
import { threadRunsRouter } from "./routers/thread-runs.router.ts";
import { threadsRouter } from "./routers/threads.router.ts";
import type { GraphServerConfiguration } from "./types.ts";
import { GRAPH_REGISTRY } from "./registry.ts";
import type { AppStorage } from "@agent-toolkit/core";
import type { BaseCheckpointSaver } from "@langchain/langgraph";
/**
 * Creates a new graph server with the specified graphs and configuration
 * @param graphConfig Array of graph definitions
 * @param config Optional server configuration
 * @returns Configured Hono app instance
 */
const createGraphHonoServer = <
  Spec extends GraphServerConfiguration,
>(
  graphConfig: Spec,
  appStorage?: AppStorage,
  checkpointer?: BaseCheckpointSaver,
) => {
  GRAPH_REGISTRY.registerGraphManager(graphConfig, appStorage, checkpointer);

  return new Hono()
    .route("/threads", threadsRouter(graphConfig))
    .route("/assistants", assistantsRouter(graphConfig))
    .route("/stateless-runs", statelessRunsRouter(graphConfig))
    .route("/thread-runs", threadRunsRouter(graphConfig));

  // Build up the app with proper typing by chaining routers
  // const app = mergeRoutes(new Hono(), ...fin);
};

export { createGraphHonoServer };
