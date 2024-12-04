import {
  Annotation,
  BaseCheckpointSaver,
  CompiledStateGraph,
} from "@langchain/langgraph";
import type { AppRouterDef } from "@/lib/hono/types.ts";
import { z } from "@hono/zod-openapi";

/**
 * APP PROPS
 *
 * -- Makes sure that the graph state annotation matches the zod schemas passed in. Zod schema is needed for app function / client generation, but the annotation is how the graph actually keeps track of the state
 */

export type ServerConfig = {
  dataDir?: string;
};

import type {
  GraphServerConfiguration,
  GraphServerProp,
} from "./app-prop-types.ts";
export { type GraphServerConfiguration, type GraphServerProp };
export type GraphRouterGenerator = (
  graph: GraphServerConfiguration,
) => AppRouterDef;
/**
 * Assistant Types
 */
export const AssistantSchema = <TConfig extends z.ZodType>(
  config_schema: TConfig,
) =>
  z.object({
    id: z.string(),
    assistant_name: z.string(),
    description: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
    config: config_schema,
  });

export type Assistant<TConfig extends z.ZodType = z.ZodType> = z.infer<
  ReturnType<typeof AssistantSchema<TConfig>>
>;

/**
 * Thread Types
 */
export const ThreadSchema = <TState extends z.ZodType>(
  state_schema: TState,
) =>
  z.object({
    id: z.string(),
    assistant_id: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
    cur_state: state_schema.optional(), // ThreadStateSchema(state_schema),
  });

export type Thread<TState extends z.ZodType = z.ZodType> = z.infer<
  ReturnType<typeof ThreadSchema<TState>>
>;

/**
 * Thread State -- used for checkpointing / human in the loop
 */
export const ThreadStateSchema = <TState extends z.ZodType>(
  state_schema: TState,
) => {
  return z.object({
    checkpoint: z.object({
      thread_id: z.string(),
      checkpoint_ns: z.string(),
      checkpoint_id: z.string().optional(),
      checkpoint_map: z.record(z.unknown()).optional(),
    }),
    metadata: z.record(z.unknown()).optional(),
    created_at: z.date(),
    next: z.string().array(), // The next nodes to run within the graph
    values: state_schema, // The state values
  });
};

export type ThreadState<TState extends z.ZodType = z.ZodType> = z.infer<
  ReturnType<typeof ThreadStateSchema<TState>>
>;

/**
 * Run Types
 */
export enum RunStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export const RunSchema = <T extends GraphServerConfiguration>(graph: T) =>
  z.object({
    id: z.string(),
    thread_id: z.string(),
    assistant_id: z.string(),
    status: z.nativeEnum(RunStatus),
    start_state: ThreadStateSchema(graph.state_schema).optional(),
    end_state: ThreadStateSchema(graph.state_schema).optional(),
    error: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
    created_at: z.date(),
    updated_at: z.date(),
    completed_at: z.date().optional(),
  });

export type Run<T extends GraphServerConfiguration> = z.infer<
  ReturnType<typeof RunSchema<T>>
>;
