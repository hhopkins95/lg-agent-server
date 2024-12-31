import { createBaseApp, createGraphHonoServer } from "@agent-toolkit/server";
import type { GraphServerConfiguration } from "@agent-toolkit/server/types";
import { ConfigurationSchema, defaultConfig } from "./config.ts";
import { graphSpecification } from "./index.ts";
import { InputSchema } from "./state.ts";

const testGraphServerSpec = {
    ...graphSpecification,
    config_schema: ConfigurationSchema,
    input_schema: InputSchema,
    default_config: defaultConfig,
} as const satisfies GraphServerConfiguration;

export type TestGraphServerSpec = typeof testGraphServerSpec;

const testGraphServer = createGraphHonoServer(testGraphServerSpec);

export const TEST_GRAPH_APP = createBaseApp().route(
    `/test-graph`,
    testGraphServer,
);

/**
 * example usage :
 *
 * import {getGraphClient}  from "server/custom-client.ts"
 * const client = getClient<TestGraphServerSpec>("{base-url}/test-graph")>
 *
 * Bun.serve({
 *     port: 8080,
 *     fetch: TEST_GRAPH_APP.fetch,
 * });
 */
