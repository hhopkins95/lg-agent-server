import createGraphHonoServer from "@/server/create-graph-server.ts";
import type { GraphServerConfiguration } from "@/server/types";
import { ConfigurationSchema, defaultConfig } from "./config.ts";
import { graphSpecification } from "./index.ts";
import { InputSchema } from "./state.ts";
import { createBaseApp } from "@/server/create-base-app.ts";
import { GRAPH_REGISTRY } from "@/server/registry.ts";
import { hc } from "hono/client";
import { getClient } from "@/server/custom-client.ts";

const testGraphServerSpec = {
    ...graphSpecification,
    config_schema: ConfigurationSchema,
    input_schema: InputSchema,
    default_config: defaultConfig,
} as const satisfies GraphServerConfiguration;

export type TestGraphServerSpec = typeof testGraphServerSpec;

const testGraphServer = createGraphHonoServer(testGraphServerSpec);

// Register the graph with the registry
GRAPH_REGISTRY.registerGraphManager(testGraphServerSpec);

export const TEST_GRAPH_APP = createBaseApp().route(
    `/test-graph`,
    testGraphServer,
);

// test client
// const client = getClient<typeof testGraphServerSpec>("/test-graph"); // hc<AppType>("/test-graph");

// const foo = await client["stateless-runs"].run.$post({
//     json: {},
// });

// const stream = await client.streamStateless({
//     json: {
//         state: {
//             input: {
//                 content: "",
//             },
//         },
//         config: {
//             config_value: "default_config",
//         },
//     },
// });

// for await (const chunk of stream) {
// }
