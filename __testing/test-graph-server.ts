import createGraphServer from "@/server/app";
import { testGraphSpecification } from "./test-graph";
import type { GraphServerConfiguration, GraphServerProp } from "@/server/types";
import { z } from "zod";

const testServerConfig: GraphServerProp = {
    ...testGraphSpecification,
    name: "test_graph_server",
    config_schema: z.object({}),
    input_schema: z.object({}),
    default_config: z.object({}),
};

const server = createGraphServer([testServerConfig]);
