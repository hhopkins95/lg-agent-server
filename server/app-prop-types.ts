import { z } from "@hono/zod-openapi";
import { Annotation, CompiledStateGraph } from "@langchain/langgraph";
import type { Assistant } from "../core/types.ts";
// Helper types for strict type checking

type StrictEqual<X, Y> = (<T>() => T extends X ? 1 : 2) extends
  (<T>() => T extends Y ? 1 : 2)
  ? (<T>() => T extends Y ? 1 : 2) extends (<T>() => T extends X ? 1 : 2) ? true
  : false
  : false;

// Validation result type
type ValidationResult<TAnnotation, TSchema> = {
  annotation: TAnnotation;
  schema: TSchema;
};

// Strict validation type
type StrictValidateStateTypes<
  TAnnotation extends ReturnType<typeof Annotation.Root<any>>,
  TSchema extends z.ZodType,
> = StrictEqual<z.infer<TSchema>, TAnnotation["State"]> extends true
  ? ValidationResult<TAnnotation, TSchema>
  : never;

type TAnnotation = ReturnType<typeof Annotation.Root<any>>;
/**
 * Graph Server -- Defines input definition for a graph server
 */
export type GraphServerConfiguration<
  TStateAnnotation extends TAnnotation = TAnnotation,
  TStateSchema extends z.ZodType = z.ZodType,
  TConfigAnnotation extends TAnnotation = TAnnotation,
  TConfigSchema extends z.ZodType = z.ZodType,
> = {
  graph_name: string;
  graph: CompiledStateGraph<any, any, any, any>;

  // Types for state / config
  state_annotation: TStateAnnotation;
  state_schema: TStateSchema;
  config_annotation: TConfigAnnotation;
  config_schema: TConfigSchema;

  // Default values
  default_state?: z.infer<TStateSchema>;
  default_config: z.infer<TConfigSchema>;

  // Assistants to launch along with the default assistant
  launch_assistants?: Array<Assistant<TConfigSchema>>;
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

export type GraphServerProp2<
  TStateAnnotation extends TAnnotation = TAnnotation, // ReturnType<typeof Annotation.Root<any>>,
  TStateSchema extends z.ZodType = z.ZodType,
  TConfigAnnotation extends TAnnotation = TAnnotation, // ReturnType<typeof Annotation.Root<any>>,
  TConfigSchema extends z.ZodType = z.ZodType,
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

//   {
//     graph_name: string;
//     // graph: CompiledStateGraph<
//     //   TAnnotation,
//     //   TConfigAnnotation
//     // > , <-- doesn't work. TODO try to get graph generic to match other inputs
//     graph: CompiledStateGraph<any, any, any, any>;
//     state_annotation: TStateAnnotation;
//     state_schema: TStateSchema;
//     config_annotation: TConfigAnnotation;
//     config_schema: TConfigSchema;
//   };

/**
 * TESTING
 */

// const fooAnnotation = Annotation.Root({
//   foo: Annotation<string>,
//   bar: Annotation<number>,
// });
// const fooAnnotation2 = Annotation.Root({
//   foo: Annotation<number>,
//   bar: Annotation<number>,
// });

// const fooSchema = z.object({
//   foo: z.string(),
//   bar: z.number(),
// });
// const fooSchema2 = z.object({
//   foo: z.number(),
//   bar: z.number(),
// });
// // Example function def
// const CreateGraphServer = <
//   TAnnotation extends ReturnType<typeof Annotation.Root<any>>,
//   TSchema extends z.ZodType,
//   TConfigAnnotation extends ReturnType<typeof Annotation.Root<any>>,
//   TConfigSchema extends z.ZodType,
// >(
//   graphs: Array<
//     GraphServerProp<TAnnotation, TSchema, TConfigAnnotation, TConfigSchema>
//   >,
//   config?: any,
// ) => {};

// const foo = CreateGraphServer([
//   {
//     graph_name: "example-agent",
//     graph: 1,
//     state_annotation: fooAnnotation2,
//     state_schema: fooSchema2,
//     config_annotation: fooAnnotation,
//     config_schema: fooSchema,
//   },
// ]);

// Extra -- This might provide better error messages if needed

// import { Annotation, CompiledStateGraph } from "@langchain/langgraph";
// import { z } from "@hono/zod-openapi";

// // Helper types for strict type checking
// type StrictEqual<X, Y> = (<T>() => T extends X ? 1 : 2) extends
//   (<T>() => T extends Y ? 1 : 2)
//   ? (<T>() => T extends Y ? 1 : 2) extends (<T>() => T extends X ? 1 : 2) ? true
//   : false
//   : false;

// // Custom error type with descriptive messages
// type TypeMismatchError<TSchema, TState> = {
//   error: "Type Mismatch";
//   message: `Schema type and Annotation State type do not match exactly:

// Schema inferred type: ADD HERE
// Annotation State type:  ADD HERE

// Make sure both types have:
// - Exactly the same property names
// - Exactly the same property types
// - No extra or missing properties`;
//   schemaType: TSchema;
//   stateType: TState;
// };

// // Validation result type
// type ValidationResult<TAnnotation, TSchema> = {
//   annotation: TAnnotation;
//   schema: TSchema;
// };

// // Strict validation type with better error messages
// type StrictValidateStateTypes<
//   TAnnotation extends ReturnType<typeof Annotation.Root<any>>,
//   TSchema extends z.ZodType,
// > = StrictEqual<z.infer<TSchema>, TAnnotation["State"]> extends true
//   ? ValidationResult<TAnnotation, TSchema>
//   : TypeMismatchError<z.infer<TSchema>, TAnnotation["State"]>;

// // Graph server prop type
// export type GraphServerProp<
//   TAnnotation extends ReturnType<typeof Annotation.Root<any>>,
//   TSchema extends z.ZodType,
//   TConfigAnnotation extends ReturnType<typeof Annotation.Root<any>>,
//   TConfigSchema extends z.ZodType,
// > = [StrictValidateStateTypes<TAnnotation, TSchema>] extends [never]
//   ? TypeMismatchError<z.infer<TSchema>, TAnnotation["State"]>
//   : [StrictValidateStateTypes<TConfigAnnotation, TConfigSchema>] extends [never]
//     ? TypeMismatchError<z.infer<TConfigSchema>, TConfigAnnotation["State"]>
//   : {
//     graph_name: string;
//     graph: CompiledStateGraph<any, any, any, any>;
//     state_annotation: TAnnotation;
//     state_schema: TSchema;
//     config_annotation: TConfigAnnotation;
//     config_schema: TConfigSchema;
//   };
