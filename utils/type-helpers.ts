import type { z } from "@hono/zod-openapi";
import type { Annotation, CompiledStateGraph } from "@langchain/langgraph";
import type { Assistant } from "../core/types_old.ts";

// Helper types for strict type checking
export type StrictEqual<X, Y> = (<T>() => T extends X ? 1 : 2) extends
    (<T>() => T extends Y ? 1 : 2)
    ? (<T>() => T extends Y ? 1 : 2) extends (<T>() => T extends X ? 1 : 2)
        ? true
    : false
    : false;

// Validation result type
export type ValidationResult<TAnnotation, TSchema> = {
    annotation: TAnnotation;
    schema: TSchema;
};

// Strict validation type
export type StrictValidateStateTypes<
    TAnnotation extends ReturnType<typeof Annotation.Root<any>>,
    TSchema extends z.ZodType,
> = StrictEqual<z.infer<TSchema>, TAnnotation["State"]> extends true
    ? ValidationResult<TAnnotation, TSchema>
    : never;

export type TAnnotation = ReturnType<typeof Annotation.Root<any>>;
