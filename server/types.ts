import type { TGraphDef } from "@/core/types.ts";
import type { StrictValidateStateTypes } from "@/lib/utils/type-helpers";
import { z } from "@hono/zod-openapi";
import { Annotation } from "@langchain/langgraph";
import type { Hono } from "hono";

type TAnnotation = ReturnType<typeof Annotation.Root<any>>;
/**
 * Graph Server -- Defines input definition for a graph server
 *
 * Includes zod schemas as well as annotaitions to allow for better route validation, and potentially client ui / app generation based on the schemass
 *
 * Uses `StrictValidateStateTypes` to ensure that the schemas match the annotation types
 */
export type GraphServerConfiguration<
  TInputAnnotation extends TAnnotation = TAnnotation,
  TInputSchema extends z.ZodType = z.ZodType,
  TOutputAnnotation extends TAnnotation = TAnnotation,
  TConfigAnnotation extends TAnnotation = TAnnotation,
  TConfigSchema extends z.ZodType = z.ZodType,
  TStreamableStateKeys extends keyof TInputAnnotation["State"] =
    keyof TInputAnnotation["State"],
  TOtherStreamableKeys extends string = string,
> =
  & TGraphDef<
    TInputAnnotation,
    TOutputAnnotation,
    TConfigAnnotation,
    TStreamableStateKeys,
    TOtherStreamableKeys
  >
  & {
    // Additional server-specific schemas for validation
    input_schema: TInputSchema;
    config_schema: TConfigSchema;
    // Override optional config to required for server
    // default_config: TConfigAnnotation["State"];
  };
/**
 * Graph server prop type
 *
 * Makes sure that the graph state annotation matches the zod schemas passed in. Zod schema is needed for app function / client generation, but the annotation is how the graph actually keeps track of the state
 *
 * Resolves to `never` if the schemas do not match and should trigger a compiler error
 */
export type GraphServerProp<
  TInputAnnotation extends TAnnotation = TAnnotation, // ReturnType<typeof Annotation.Root<any>>,
  TInputSchema extends z.ZodType = z.ZodType,
  TOutputAnnotation extends TAnnotation = TAnnotation, // ReturnType<typeof Annotation.Root<any>>,
  TConfigAnnotation extends TAnnotation = TAnnotation, // ReturnType<typeof Annotation.Root<any>>,
  TConfigSchema extends z.ZodType = z.ZodType,
> = StrictValidateStateTypes<TInputAnnotation, TInputSchema> extends never
  ? never
  : StrictValidateStateTypes<TConfigAnnotation, TConfigSchema> extends never
    ? never
  : GraphServerConfiguration<
    TInputAnnotation,
    TInputSchema,
    TOutputAnnotation,
    TConfigAnnotation,
    TConfigSchema
  >;

export type GraphRouter = (graphDef: GraphServerConfiguration) => Hono;
