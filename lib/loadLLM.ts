import { ChatOllama } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";
import {
  OLLAMA_MODELS,
  OPEN_ROUTER_MODELS,
  type TModelDef,
} from "./models-registry";

export const getLLM = (model: TModelDef) => {
  switch (model.source) {
    case "openrouter":
      return getOpenRouterLLM(model.name);
    case "ollama":
      return getOllamaLLM(model.name);
    default:
      throw new Error("Unknown model source");
  }
};

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
    modelName,
    // temperature: 0.8,
    streaming: true,
    openAIApiKey: process.env.OPENROUTER_API_KEY,
  }, {
    basePath: process.env.OPENROUTER_BASE_URL + "/api/v1",
    // baseOptions: {
    //     headers: {
    //         "HTTP-Referer": "https://yourapp.com/", // Optional, for including your app on openrouter.ai rankings.
    //         "X-Title": "Langchain.js Testing", // Optional. Shows in rankings on openrouter.ai.
    //     },
    // },
  });

  return model;
};
