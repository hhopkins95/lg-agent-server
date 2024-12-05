import {
  Annotation,
  END,
  type LangGraphRunnableConfig,
  MemorySaver,
  MessagesAnnotation,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";

/**
 * Define the configurable parameters for the agent.
 */
import { SYSTEM_PROMPT_TEMPLATE } from "./prompts.ts";

const ConfigurationAnnotation = Annotation.Root({
  /**
   * The system prompt to be used by the agent.
   */
  systemPromptTemplate: Annotation<string>,

  /**
   * The name of the language model to be used by the agent.
   */
  model: Annotation<string>,
});

const ConfigurationSchema = z.object({
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

/**
 * STATE
 */
const GraphStateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  foo: Annotation<number>,
});

/**
 * TOOLS
 */
import { tool } from "@langchain/core/tools";

// Example tool
const addNumbersTool = tool((input) => {
  console.log("Add numbers tool called with input", input);
  return input.a + input.b;
}, {
  name: "add_numbers",
  description: "Call to add two numbers.",
  schema: z.object({
    a: z.number().describe("First number to add."),
    b: z.number().describe("Second number to add."),
  }),
});
/**
 * NODES
 */
// Define the function that calls the model
async function callModel(
  state: typeof GraphStateAnnotation.State,
  config: LangGraphRunnableConfig<typeof ConfigurationAnnotation.State>,
): Promise<typeof GraphStateAnnotation.Update> {
  const c = ensureConfiguration(config); // if c is not defined, create it with defaults
  const curFoo = state.foo ?? 0;
  const messages = state.messages ?? [];

  console.log({ curFoo, messages });

  const llm = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0,
  }).bindTools([addNumbersTool]);

  // const llm = new ChatOllama({
  //   model: "llama3",
  //   temperature: 0,
  // }).bindTools([addNumbersTool]);

  const res = await llm.invoke(messages);

  return {
    messages: res,
    foo: curFoo + 1,
  };
}

// Define the function that determines whether to continue or not
const shouldContinue = (state: typeof GraphStateAnnotation.State) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];
  if (
    "tool_calls" in lastMessage && Array.isArray(lastMessage.tool_calls) &&
    lastMessage.tool_calls?.length
  ) {
    return "tools";
  }
  return END;
};

// Tool node
import { ToolNode } from "@langchain/langgraph/prebuilt";
const tools = [addNumbersTool];
// @ts-ignore -- not sure why this doesn't work -- it's the example from the docs
const toolNode = new ToolNode(tools);

/**
 * GRAPH
 */
// Define a new graph. We use the prebuilt MessagesAnnotation to define state:
// https://langchain-ai.github.io/langgraphjs/concepts/low_level/#messagesannotation
const workflow = new StateGraph(
  GraphStateAnnotation,
  ConfigurationAnnotation,
)
  .addNode("callModel", callModel)
  .addNode("tools", toolNode)
  .addEdge(START, "callModel")
  .addEdge("tools", "callModel")
  .addConditionalEdges(
    "callModel",
    shouldContinue,
    [END, "tools"],
  );

export const graph = workflow.compile({
  interruptBefore: [], // if you want to update the state before calling the tools
  interruptAfter: [],
  checkpointer: new MemorySaver(),
});

// Export other things needed for the graph server
export {
  ConfigurationAnnotation,
  ConfigurationSchema,
  GraphStateAnnotation,
  // StateSchema,
};

// const messages = [
//   new HumanMessage("What is 1 + 1?"),
// ];

// const thread_id = "abc";

// const abr = await graph.invoke({
//   messages,
// }, {
//   configurable: {
//     model: "abv",
//     systemPromptTemplate: "",
//     thread_id: thread_id,
//   },
// });

// console.log({ abr });

// const foo = await graph.getState({
//   configurable: {
//     thread_id,
//   },
// })

// console.log(foo.values);

// const stream = await graph.stream({
//   messages,
//   foo: 10,
// });

// for await (const event of stream) {
//   console.log(event);
// }
