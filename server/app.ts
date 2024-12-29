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
import { hc } from "hono/client";
import { graphSpecification } from "@/__testing/example-graph/index.ts";
import { testGraphServerSpec } from "@/__testing/example-graph/server.ts";
import { z } from "zod";
/**
 * Creates a new graph server with the specified graphs and configuration
 * @param graphConfig Array of graph definitions
 * @param config Optional server configuration
 * @returns Configured Hono app instance
 */
const createGraphServer = <
  Spec extends GraphServerConfiguration,
  GraphInputSchema extends z.ZodType,
  GraphConfigSchema extends z.ZodType,
>(
  graphConfig: Spec, // TGraphDefs,
  graphInputSchema: GraphInputSchema,
  graphConfigSchema: GraphConfigSchema,
  appStorage?: AppStorage,
  checkpointer?: BaseCheckpointSaver,
) => {
  const statelessRuns = statelessRunsRouter<
    Spec,
    GraphInputSchema,
    GraphConfigSchema
  >(
    graphConfig,
    graphInputSchema,
    graphConfigSchema,
  );

  return new Hono()
    // .route("/threads", threadsRouter(graphConfig))
    // .route("/assistants", assistantsRouter(graphConfig))
    .route("/stateless-runs", statelessRuns);

  // Build up the app with proper typing by chaining routers
  // const app = mergeRoutes(new Hono(), ...fin);
};

export default createGraphServer;

const app = createGraphServer(
  testGraphServerSpec,
  testGraphServerSpec.input_schema,
  testGraphServerSpec.config_schema,
);

type AppType = typeof app;
const client = hc<AppType>("/");
const res = await client["stateless-runs"].run.$post({
  json: {},
});
const vals = await res.json();

if (vals.success == true) {
}
