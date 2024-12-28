import type { z } from "@hono/zod-openapi";
import type { Annotation } from "@langchain/langgraph";

/**
 * Strictly checks if two types are exactly equal.
 * This is more precise than using the regular `extends` keyword as it ensures both types
 * are identical in both directions.
 *
 * @example
 * ```typescript
 * // Example 1: Identical types
 * type A = { x: number; y: string };
 * type B = { x: number; y: string };
 * type Result1 = StrictEqual<A, B>; // true
 *
 * // Example 2: Different types
 * type C = { x: number };
 * type Result2 = StrictEqual<A, C>; // false
 *
 * // Example 3: Structurally similar but different types
 * type D = { x: number; y: number };
 * type Result3 = StrictEqual<A, D>; // false
 * ```
 */
export type StrictEqual<X, Y> = (<T>() => T extends X ? 1 : 2) extends
    (<T>() => T extends Y ? 1 : 2)
    ? (<T>() => T extends Y ? 1 : 2) extends (<T>() => T extends X ? 1 : 2)
        ? true
    : false
    : false;

/**
 * Represents the result of a validation operation containing both the annotation
 * and schema types.
 *
 * @example
 * ```typescript
 * import { z } from "@hono/zod-openapi";
 * import { Annotation } from "@langchain/langgraph";
 *
 * // Define a schema
 * const schema = z.object({ message: z.string() });
 *
 * // Create an annotation
 * const annotation = Annotation.Root({ message: "Hello" });
 *
 * // Use ValidationResult type
 * const result: ValidationResult<typeof annotation, typeof schema> = {
 *   annotation: annotation,
 *   schema: schema
 * };
 * ```
 */
export type ValidationResult<TAnnotation, TSchema> = {
    annotation: TAnnotation;
    schema: TSchema;
};

/**
 * Validates that a schema type strictly matches an annotation's state type.
 * Returns ValidationResult if types match exactly, never if they don't.
 * This ensures type safety between Zod schemas and LangGraph annotations.
 *
 * @example
 * ```typescript
 * import { z } from "@hono/zod-openapi";
 * import { Annotation } from "@langchain/langgraph";
 *
 * // Define matching types
 * const schema = z.object({ count: z.number() });
 * const annotation = Annotation.Root<{ count: number }>();
 *
 * // This works - types match exactly
 * type Valid = StrictValidateStateTypes<typeof annotation, typeof schema>;
 *
 * // This would be 'never' - types don't match
 * const wrongSchema = z.object({ count: z.string() });
 * type Invalid = StrictValidateStateTypes<typeof annotation, typeof wrongSchema>;
 * ```
 */
export type StrictValidateStateTypes<
    TAnnotation extends ReturnType<typeof Annotation.Root<any>>,
    TSchema extends z.ZodType,
> = StrictEqual<z.infer<TSchema>, TAnnotation["State"]> extends true
    ? ValidationResult<TAnnotation, TSchema>
    : never;
