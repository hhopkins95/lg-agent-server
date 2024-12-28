import type { TInterrupt } from "@/lib/utils/interrupt-graph";
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
  TInputAnnotation extends TAnnotation = TAnnotation,
  TOutputAnnotation extends TAnnotation = TAnnotation,
  TConfigAnnotation extends TAnnotation = TAnnotation,
  TStreamableStateKeys extends keyof TOutputAnnotation["State"] =
    keyof TOutputAnnotation["State"],
  TOtherStreamableKeys extends string = string,
> = {
  name: string;
  description?: string; // for documentation

  graph: CompiledStateGraph<any, any, any, any>;

  // schemas
  input_annotation: TInputAnnotation;
  output_annotation: TOutputAnnotation;
  config_annotation: TConfigAnnotation;

  // input / output keys -- will default to all. Mainly used for documentation / client type generation

  // defaults
  // default_state?: TStateAnnotation["State"];
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
  status: TThreadStatus;
  values?: TState["State"]; // current state values
};

export type TThreadStatus = {
  status: "idle" | "running";
} | {
  status: "interrupted";
  pending_interrupt: TInterrupt;
} | {
  status: "error";
  error: string;
};

// METHOD TYPES
export type TGetRunConfigParams<TGraph extends TGraphDef> = {
  assistant_id?: string;
  thread_id?: string;
  config?: TGraph["config_annotation"]["State"];
};

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
  full_state_update?: TThread<TGraph["output_annotation"]>["values"];
  status_change?: TThread<TGraph["input_annotation"]>["status"];
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

export { type TInterrupt };
