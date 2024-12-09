import type {
  AIMessageChunk,
  ToolMessageChunk,
} from "@langchain/core/messages";
import {
  Annotation,
  type CompiledStateGraph,
  type StateSnapshot,
} from "@langchain/langgraph";

export type TAnnotation = ReturnType<typeof Annotation.Root<any>>;

/**
 * Graph Def
 */
export type TGraphDef<
  TStateAnnotation extends TAnnotation = TAnnotation,
  TConfigAnnotation extends TAnnotation = TAnnotation,
  TStreamableStateKeys extends keyof TStateAnnotation["State"] =
    keyof TStateAnnotation["State"],
  TOtherStreamableKeys extends string = string,
> = {
  name: string;
  description?: string; // for documentation

  graph: CompiledStateGraph<any, any, any, any>;

  // schemas
  state_annotation: TStateAnnotation;
  config_annotation: TConfigAnnotation;

  // input / output keys -- will default to all. Mainly used for documentation / client type generation
  input_keys?: Array<keyof TStateAnnotation["State"]>;
  output_keys?: Array<keyof TStateAnnotation["State"]>;

  // defaults
  default_state?: TStateAnnotation["State"];
  default_config?: TConfigAnnotation["State"];

  // stream config
  state_llm_stream_keys?: TStreamableStateKeys[]; // streamed llm calls that are directly written to the state
  other_llm_stream_keys?: TOtherStreamableKeys[]; // other llm calls that are streamed

  // launch assistants (other assisitatnts to add to graph manager on init)
  launch_assistants?: Array<TAssistant<TConfigAnnotation>>;
};

/**
 * Assistant
 *
 * Configured instance of a graph
 */

export type TAssistant<TConfig extends TAnnotation> = {
  id: string;
  graph_name: string;
  description?: string;
  metadata?: Record<string, unknown>;
  config: TConfig["State"];
};

/**
 * Thread
 *
 * Collection of runs for a graph. Structure for managing state
 */

export type TThread<TState extends TAnnotation> = {
  id: string;
  assistant_id?: string;
  created_at: string;
  updated_at: string;
  status: "idle" | "busy" | "interrupted" | "error";
  values?: TState["State"]; // current state values
};

export type TThreadState<TState extends TAnnotation> = StateSnapshot & {
  values: TState["State"];
}; // Current nodes, tasks, etc..

/**
Stream Response
*/
export type LLMStreamMeta = {
  tags?: string[];
  name?: string;
  langgraph_node?: string;
  thread_id?: string;
  langgraph_step?: number;
};
export type TStreamYield<TGraph extends TGraphDef> = {
  full_state_update?: TGraph["state_annotation"]["State"];
  state_llm_stream_data?: {
    key: TGraph extends TGraphDef<any, any, infer K, any> ? K : never;
    chunk: AIMessageChunk | ToolMessageChunk;
    meta: LLMStreamMeta;
  };
  other_llm_stream_data?: {
    key: TGraph extends TGraphDef<any, any, any, infer K> ? K : never;
    chunk: AIMessageChunk | ToolMessageChunk;
    meta: LLMStreamMeta;
  };
};

// import {
//   ConfigurationAnnotation,
//   graph,
//   GraphStateAnnotation,
// } from "@/__example-agents__/reAct/graph";

// const testGraph: TGraphDef<
//   typeof GraphStateAnnotation,
//   typeof ConfigurationAnnotation
// > = {
//   name: "test_graph",
//   graph: graph,
//   config_annotation: ConfigurationAnnotation,
//   state_annotation: GraphStateAnnotation,
//   state_llm_stream_keys: ["messages"],
// };

// let foo: TStreamYield<typeof testGraph>;

// type FooGraphDef<TStateAnnotation extends TAnnotation = TAnnotation> = {
//   stateAnnotation: TStateAnnotation;
//   streamKeys?: (keyof TStateAnnotation["State"])[];
// };

// type StreamYield<TGraphDef extends FooGraphDef<any>> = {
//   state_llm_stream_data?: {
//     key: TGraphDef["streamKeys"][number];
//   };
// };

// const annotation = Annotation.Root({
//   foo: Annotation<string>(),
//   bar: Annotation<number>(),
// });

// const graphDef: FooGraphDef = {
//   stateAnnotation: annotation,
//   streamKeys: ["foo"],
// };

// let streamYield: StreamYield<typeof graphDef>;

// streamYield.state_llm_stream_data?.key; // Key type should be "foo"
