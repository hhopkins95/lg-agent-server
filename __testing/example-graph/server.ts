import createGraphServer from "@/server/app";
import type { GraphServerConfiguration } from "@/server/types";
import { ConfigurationSchema, defaultConfig } from "./config.ts";
import { graphSpecification } from "./index.ts";
import { InputSchema } from "./state.ts";

export const testGraphServerSpec: GraphServerConfiguration = {
    ...graphSpecification,
    config_schema: ConfigurationSchema,
    input_schema: InputSchema,
    default_config: defaultConfig,
};

// export const testGraphServerSpec = createGraphServer<typeof testGraphServer>(
//     testGraphServer,
// );
// export type AppType = typeof testGraphServerSpec;
// import { hc } from "hono/client";
// const client = hc<AppType>("/");

// const foo = await (await client["stateless-runs"].run.$post({
//     json: {},
// })).json();

// if (foo.success) {
//     foo.values;
// }
