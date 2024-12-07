import type {
  AIMessageChunk,
  ToolMessageChunk,
} from "@langchain/core/messages";
import type {
  Annotation,
  CompiledStateGraph,
  StateSnapshot,
} from "@langchain/langgraph";

export type TAnnotation = ReturnType<typeof Annotation.Root<any>>;

/**
 * Graph Def
 */
export type TGraphDef<
  TState extends TAnnotation,
  TConfig extends TAnnotation,
> = {
  name: string;
  description?: string; // for documentation

  graph: CompiledStateGraph<any, any>;

  // schemas
  state_annotation: TState;
  config_annotation: TConfig;

  // input / output keys -- will default to all. Mainly used for documentation / client type generation
  input_keys?: Array<keyof TState["State"]>;
  output_keys?: Array<keyof TState["State"]>;

  // defaults
  default_state?: TState["State"];
  default_config?: TConfig["State"];

  // stream config
  state_llm_stream_keys?: Record<string, keyof TState["State"]>; // llm streams that are directly written to the state
  other_llm_stream_keys?: Record<string, string>; // other LLM calls that want to be streamed back to the client

  // launch assistants (other assisitatnts to add to graph manager on init)
  launch_assistants?: Array<TAssistant<TConfig>>;
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
  config: TConfig;
};

/**
 * Thread
 *
 * Collection of runs for a graph. Structure for managing state
 */

export type TThread<TState extends TAnnotation> = {
  id: string;
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
type LLMStreamChunk = {
  chunk: AIMessageChunk | ToolMessageChunk;
  meta?: {
    tags?: string[];
    name?: string;
    langgraph_node?: string;
    thread_id?: string;
    langgraph_step?: number;
  };
};

export type TStreamYield<TGraph extends TGraphDef<any, any>> = {
  full_state_update?: TGraph["state_annotation"]["State"];
  state_llm_stream_data?: {
    [key in keyof TGraph["state_llm_stream_keys"]]: LLMStreamChunk;
  };
  other_llm_stream_data?: {
    [key in keyof TGraph["other_llm_stream_keys"]]: LLMStreamChunk;
  };
};

// let foo : AIMessageChunk
