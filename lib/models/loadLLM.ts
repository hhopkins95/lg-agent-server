import { ChatOllama } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";
import {
  ALL_MODELS,
  type AllModelKeys,
  OLLAMA_MODELS,
  OPEN_ROUTER_MODELS,
  type TModelDef,
} from "./models-registry";

// Function overload signatures
export function getLLM(model: TModelDef): ChatOllama | ChatOpenAI;
export function getLLM(modelName: AllModelKeys): ChatOllama | ChatOpenAI;

// Implementation
export function getLLM(
  modelInput: TModelDef | AllModelKeys,
): ChatOllama | ChatOpenAI {
  // If modelInput is a string (AllModelKeys), convert it to TModelDef
  const model: TModelDef = typeof modelInput === "string"
    ? (ALL_MODELS[modelInput] as TModelDef)
    : modelInput;

  if (!model) {
    throw new Error(`Invalid model: ${modelInput}`);
  }

  switch (model.source) {
    case "openrouter":
      return getOpenRouterLLM(model.name);
    case "ollama":
      return getOllamaLLM(model.name);
    default:
      throw new Error("Unknown model source");
  }
}
export const getOllamaLLM = (modelName: string) => {
  const model = new ChatOllama({
    model: modelName,
    // temperature: 0.8,
    streaming: true,
  });

  return model;
};

export const getOpenRouterLLM = (modelName: string) => {
  const model = new ChatOpenAI({
    streamUsage: false,
    modelName: modelName,
    streaming: true,
    apiKey: process.env.OPENROUTER_API_KEY,
    logprobs: false,
  }, {
    basePath: "https://openrouter.ai/api/v1",
    // baseOptions: {
    //     headers: {
    //         "HTTP-Referer": "https://yourapp.com/", // Optional, for including your app on openrouter.ai rankings.
    //         "X-Title": "Langchain.js Testing", // Optional. Shows in rankings on openrouter.ai.
    //     },
    // },
  });

  console.log("post - init");
  return model;
};

/**
 * This is a hack to silence a console warning from LangChain.
 *
 * It doesn't like that the model name from openrouter.ai doesn't match the model name from OpenAI. -- shouldnt have any effect on operation
 */
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    !args[0]?.includes(
      "Failed to calculate number of tokens, falling back to approximate count",
    )
  ) {
    originalWarn.apply(console, args);
  }
};
