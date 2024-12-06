import type { TAnnotation } from "@/lib/utils/type-helpers";
import type { CompiledStateGraph, StateSnapshot } from "@langchain/langgraph";
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
