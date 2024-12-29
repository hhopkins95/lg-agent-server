import createGraphHonoServer from "@/server/create-graph-server.ts";
import type { GraphServerConfiguration } from "@/server/types";
import { ConfigurationSchema, defaultConfig } from "./config.ts";
import { graphSpecification } from "./index.ts";
import { InputSchema } from "./state.ts";
import { createBaseApp } from "@/server/create-base-app.ts";
import { GRAPH_REGISTRY } from "@/server/registry.ts";

export const testGraphServerSpec = {
    ...graphSpecification,
    config_schema: ConfigurationSchema,
    input_schema: InputSchema,
    default_config: defaultConfig,
} as const satisfies GraphServerConfiguration;

const testGraphServer = createGraphHonoServer(testGraphServerSpec);

// Register the graph with the registry
GRAPH_REGISTRY.registerGraphManager(testGraphServerSpec);

export const TEST_GRAPH_APP = createBaseApp().route(
    `/test-graph`,
    testGraphServer,
);
export type AppType = typeof TEST_GRAPH_APP;
