import createGraphServer from "@/server/app";
import type { GraphServerConfiguration } from "@/server/types";
import { ConfigurationSchema, defaultConfig } from "./config.ts";
import { graphSpecification } from "./index.ts";
import { InputSchema } from "./state.ts";

const testGraphServer: GraphServerConfiguration = {
    ...graphSpecification,
    config_schema: ConfigurationSchema,
    input_schema: InputSchema,
    default_config: defaultConfig,
};

export const server = createGraphServer(testGraphServer);
export type AppType = typeof server;
import { hc } from "hono/client";
const client = hc<AppType>("/");

const foo = await (await client["stateless-runs"].run.$post({
    json: {
        config: {},
    },
})).json();

if (foo.success) {
    foo.values;
}
