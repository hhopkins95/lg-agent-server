import type { TAnnotation } from "@/utils/type-helpers.ts";
import type { CompiledStateGraph, StateSnapshot } from "@langchain/langgraph";
/**
 * Graph Def
 */
export type TGraphDef<
  TState extends TAnnotation,
  TInput extends TAnnotation,
  TOutput extends TAnnotation,
  TConfig extends TAnnotation,
> = {
  name: string;
  description?: string; // for documentation

  graph: CompiledStateGraph<any, any>;

  // schemas
  state_annotation: TState;
  input_annotation: TInput;
  output_annotation: TOutput;
  config_annotation: TConfig;

  // defaults
  default_state?: TInput["State"];
  default_config?: TConfig["State"];

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
