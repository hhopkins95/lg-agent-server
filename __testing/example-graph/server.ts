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

export const server = createGraphServer([testGraphServer]);

export type AppType = typeof server;
import { hc } from 'hono/client'
const client = hc<AppType>('http://localhost:8787/')


const foo = await client.