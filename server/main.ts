import CreateGraphServer from "./app.ts";
import {
  ConfigurationAnnotation,
  ConfigurationSchema,
  graph,
  GraphStateAnnotation,
  StateSchema,
} from "../__example-agents__/graph.ts";
import env from "./lib/constants/environment.ts";

// Testing -- use to check TS generics
// import { z } from "zod";
// import { Annotation } from "@langchain/langgraph";

// const fooAnnotation = Annotation.Root({
//   foo: Annotation<string>,
//   bar: Annotation<number>,
// });

// const fooSchema = z.object({
//   foo: z.string(),
//   bar: z.number(),
// });

const app = CreateGraphServer([
  {
    graph_name: "example-agent",
    graph: graph,
    state_annotation: GraphStateAnnotation,
    state_schema: StateSchema,
    config_annotation: ConfigurationAnnotation,
    config_schema: ConfigurationSchema,
    default_config: {
      model: "gpt-3.5-turbo",
      systemPromptTemplate: "You are a helpful assistant.",
    },
  },
]);

export default {
  port: 1234,
  fetch: app.fetch,
};
