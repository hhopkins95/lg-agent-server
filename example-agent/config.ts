/**
 * Define the configurable parameters for the agent.
 */
import { Annotation } from "@langchain/langgraph";
import { SYSTEM_PROMPT_TEMPLATE } from "./prompts.ts";
import { type LangGraphRunnableConfig } from "@langchain/langgraph";
import { z } from "zod";

export const ConfigurationAnnotation = Annotation.Root({
  /**
   * The system prompt to be used by the agent.
   */
  systemPromptTemplate: Annotation<string>,

  /**
   * The name of the language model to be used by the agent.
   */
  model: Annotation<string>,
});

export const ConfigurationSchema = z.object({
  systemPromptTemplate: z.string(),
  model: z.string(),
});

export function ensureConfiguration(
  config: LangGraphRunnableConfig,
): typeof ConfigurationAnnotation.State {
  /**
   * Ensure the defaults are populated.
   */
  const configurable = config.configurable ?? {};
  return {
    systemPromptTemplate: configurable.systemPromptTemplate ??
      SYSTEM_PROMPT_TEMPLATE,
    model: configurable.model ?? "claude-3-5-sonnet-20240620",
  };
}
