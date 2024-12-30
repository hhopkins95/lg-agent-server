import type { AppStorage } from "@/core/storage/types.ts";
import type { BaseCheckpointSaver } from "@langchain/langgraph";
import { Hono } from "hono";
import { statelessRunsRouter } from "./routers/stateless-runs.router.ts";
import type { GraphServerConfiguration } from "./types.ts";
import { assistantsRouter } from "./routers/assistants.router.ts";
import { threadsRouter } from "./routers/threads.router.ts";
import { threadRunsRouter } from "./routers/thread-runs.router.ts";
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
) => {
  return new Hono()
    .route("/threads", threadsRouter(graphConfig))
    .route("/assistants", assistantsRouter(graphConfig))
    .route("/stateless-runs", statelessRunsRouter(graphConfig))
    .route("/thread-runs", threadRunsRouter(graphConfig));

  // Build up the app with proper typing by chaining routers
  // const app = mergeRoutes(new Hono(), ...fin);
};

export default createGraphHonoServer;
