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
import { type AllModelKeys } from "@/lib/models/models-registry";
import { getLLM } from "@/lib/models/loadLLM";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { tool } from "@langchain/core/tools";
import { drawGraphPng } from "@/lib/utils/draw-graph-png";
import { ensureGraphConfiguration } from "@/lib/utils/get-graph-config";

//  CONFIGURATION
const GraphConfigurationAnnotation = Annotation.Root({
  model: Annotation<AllModelKeys>,
});
const defaultConfig: typeof GraphConfigurationAnnotation.State = {
  model: "claude3_5",
};

// STATE
const GraphStateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  count: Annotation<number>, // example number property -- counts how many times the model has been called
});

// TOOLS
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

// NODES
const tools = [addNumbersTool];
const toolNode = new ToolNode(tools);

async function callModel(
  state: typeof GraphStateAnnotation.State,
  runnableConfig: LangGraphRunnableConfig<
    typeof GraphConfigurationAnnotation.State
  >,
): Promise<typeof GraphStateAnnotation.Update> {
  const c = ensureGraphConfiguration(runnableConfig, defaultConfig); // if c is not defined, create it with defaults
  const llm = getLLM(c.model).bindTools(tools);

  const curCount = state.count ?? 0;
  const messages = state.messages ?? [];

  const res = await llm.invoke(messages);

  return {
    messages: res,
    count: curCount + 1,
  };
} // Call the model

const router = (state: typeof GraphStateAnnotation.State) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];
  if (
    "tool_calls" in lastMessage && Array.isArray(lastMessage.tool_calls) &&
    lastMessage.tool_calls?.length
  ) {
    return "tools";
  }
  return END;
}; // Determines whether or not to call the tool node, or to end the graph after the 'callModel' node

// GRAPH
const workflow = new StateGraph(
  GraphStateAnnotation,
  GraphConfigurationAnnotation,
)
  // nodes
  .addNode("callModel", callModel)
  .addNode("tools", toolNode)
  // edges
  .addEdge(START, "callModel")
  .addEdge("tools", "callModel")
  // conditional edges (routers)
  .addConditionalEdges(
    "callModel",
    router,
    [END, "tools"],
  );

export const graph = workflow.compile({
  // checkpointer: new MemorySaver(),
});

// Export other things needed for the graph server
export {
  GraphConfigurationAnnotation as ConfigurationAnnotation,
  GraphStateAnnotation,
};
