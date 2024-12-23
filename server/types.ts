import { z } from "@hono/zod-openapi";
import { Annotation, CompiledStateGraph } from "@langchain/langgraph";
import type { TAssistant } from "@/core/types.ts";
import type {
  StrictEqual,
  StrictValidateStateTypes,
  ValidationResult,
} from "@/lib/utils/type-helpers";

type TAnnotation = ReturnType<typeof Annotation.Root<any>>;
/**
 * Graph Server -- Defines input definition for a graph server
 *
 * Includes zod schemas as well as annotaitions to allow for better route validation, and potentially client ui / app generation based on the schemass
 *
 * Uses `StrictValidateStateTypes` to ensure that the schemas match the annotation types
 */
export type GraphServerConfiguration<
  TStateAnnotation extends TAnnotation = TAnnotation,
  TStateSchema extends z.ZodType = z.ZodType,
  TConfigAnnotation extends TAnnotation = TAnnotation,
  TConfigSchema extends z.ZodType = z.ZodType,
> = {
  graph_name: string;
  graph: CompiledStateGraph<any, any>;

  // Types for state / config
  state_annotation: TStateAnnotation;
  state_schema: TStateSchema;
  config_annotation: TConfigAnnotation;
  config_schema: TConfigSchema;

  // Default values
  default_state?: z.infer<TStateSchema>;
  default_config: z.infer<TConfigSchema>;

  // Assistants to launch along with the default assistant
  launch_assistants?: Array<TAssistant<TConfigAnnotation>>;
};
/**
 * Graph server prop type
 *
 * Makes sure that the graph state annotation matches the zod schemas passed in. Zod schema is needed for app function / client generation, but the annotation is how the graph actually keeps track of the state
 *
 * Resolves to `never` if the schemas do not match and should trigger a compiler error
 */
export type GraphServerProp<
  TStateAnnotation extends TAnnotation, // ReturnType<typeof Annotation.Root<any>>,
  TStateSchema extends z.ZodType,
  TConfigAnnotation extends TAnnotation, // ReturnType<typeof Annotation.Root<any>>,
  TConfigSchema extends z.ZodType,
> = StrictValidateStateTypes<TStateAnnotation, TStateSchema> extends never
  ? never
  : StrictValidateStateTypes<TConfigAnnotation, TConfigSchema> extends never
    ? never
  : GraphServerConfiguration<
    TStateAnnotation,
    TStateSchema,
    TConfigAnnotation,
    TConfigSchema
  >;
