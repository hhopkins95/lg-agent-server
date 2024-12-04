import { GraphServerProp } from "../../types.ts";
import { type Annotation } from "@langchain/langgraph";
import { z } from "zod";

/**
 * Makes sure the graph state annotation matches the zod schemas passed in
 *
 * @param graph
 * @returns
 */
export const getVerifiedGraph = <
  TAnnotation extends ReturnType<typeof Annotation.Root<any>>,
  TSchema extends z.ZodType,
  TConfigAnnotation extends ReturnType<typeof Annotation.Root<any>>,
  TConfigSchema extends z.ZodType,
>(
  graph: GraphServerProp<
    TAnnotation,
    TSchema,
    TConfigAnnotation,
    TConfigSchema
  >,
) => {
  return graph;
};
