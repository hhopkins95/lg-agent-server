import createGraphServer from "@/server/app";
import { graphSpecification } from "./index.ts";
import { InputSchema } from "./state.ts";
import { ConfigurationSchema, defaultConfig } from "./config.ts";
import type { GraphServerProp } from "@/server/types";

const testGraphServer: GraphServerProp = {
    ...graphSpecification,
    name: "test_graph_server",
    config_schema: ConfigurationSchema,
    input_schema: InputSchema,
    default_config: defaultConfig,
};

export const server = createGraphServer([testGraphServer]);
