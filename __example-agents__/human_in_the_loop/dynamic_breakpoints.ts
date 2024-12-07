import {
  Annotation,
  END,
  type LangGraphRunnableConfig,
  MemorySaver,
  MessagesAnnotation,
  NodeInterrupt,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { type AIMessage } from "@langchain/core/messages";
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { type AllModelKeys } from "@/lib/models/models-registry";
import { getLLM } from "@/lib/models/loadLLM";
import { ensureGraphConfiguration } from "@/lib/utils/get-graph-config";
import { logStremEvent } from "@/lib/utils/log-stream-events";
import { drawGraphPng } from "@/lib/utils/draw-graph-png";

// CONFIGURATION
const GraphConfigurationAnnotation = Annotation.Root({
  model: Annotation<AllModelKeys>(),
});

const defaultConfig: typeof GraphConfigurationAnnotation.State = {
  model: "claude3_5",
};

// STATE
const GraphStateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  /**
   * Whether or not permission has been granted to refund the user.
   */
  refundAuthorized: Annotation<boolean>(),
});

const defaultState: typeof GraphStateAnnotation.State = {
  messages: [],
  refundAuthorized: false,
};

// TOOLS
const processRefundTool = tool(
  (input) => {
    return `Successfully processed refund for ${input.productId}`;
  },
  {
    name: "process_refund",
    description: "Process a refund for a given product ID.",
    schema: z.object({
      productId: z.string().describe("The ID of the product to be refunded."),
    }),
  },
);

const tools = [processRefundTool];

// NODES
async function callTool(state: typeof GraphStateAnnotation.State) {
  const { messages, refundAuthorized } = state;
  if (!refundAuthorized) {
    throw new NodeInterrupt("Permission to refund is required.");
  }

  const lastMessage = messages[messages.length - 1];
  const messageCastAI = lastMessage as AIMessage;
  if (messageCastAI._getType() !== "ai" || !messageCastAI.tool_calls?.length) {
    throw new Error("No tools were called.");
  }
  const toolCall = messageCastAI.tool_calls[0];

  const refundResult = await processRefundTool.invoke(toolCall);

  return {
    messages: refundResult,
  };
}

async function callModel(
  state: typeof GraphStateAnnotation.State,
  runnableConfig: LangGraphRunnableConfig<
    typeof GraphConfigurationAnnotation.State
  >,
) {
  const c = ensureGraphConfiguration(runnableConfig, defaultConfig);
  const llm = getLLM(c.model).bindTools(tools);
  const result = await llm.invoke(state.messages);
  return { messages: [result] };
}

const shouldContinue = (state: typeof GraphStateAnnotation.State) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];
  const messageCastAI = lastMessage as AIMessage;
  if (messageCastAI._getType() !== "ai" || !messageCastAI.tool_calls?.length) {
    return END;
  }
  return "tools";
};

// GRAPH
const workflow = new StateGraph(
  GraphStateAnnotation,
  GraphConfigurationAnnotation,
)
  .addNode("agent", callModel)
  .addEdge(START, "agent")
  .addNode("tools", callTool)
  .addEdge("tools", "agent")
  .addConditionalEdges("agent", shouldContinue, ["tools", END]);

export const graph = workflow.compile({
  checkpointer: new MemorySaver(),
});

async function main() {
  const config = {
    configurable: {
      thread_id: "refunder_dynamic",
      model: "claude3_5" as const,
    },
    streamMode: "updates" as const,
  };

  const input = {
    messages: [
      {
        role: "user",
        content: "Can I have a refund for my purchase? Order no. 123",
      },
    ],
  };

  // First run - will be interrupted due to missing refund authorization
  for await (const event of await graph.stream(input, config)) {
    const key = Object.keys(event)[0];
    if (key) {
      console.log(`Event: ${key}\n`);
    }
  }

  console.log("\n---INTERRUPTING GRAPH TO UPDATE STATE---\n\n");

  // Log the current state before update
  console.log(
    "---refundAuthorized value before state update---",
    await graph.getState(config),
  );

  // Update the state to authorize the refund
  await graph.updateState(config, { refundAuthorized: true });

  // Log the state after update
  console.log(
    "---refundAuthorized value after state update---",
    await graph.getState(config),
  );

  console.log("\n---CONTINUING GRAPH AFTER STATE UPDATE---\n\n");

  // Continue the graph execution with updated state
  for await (const event of await graph.stream(null, config)) {
    logStremEvent(event);
  }
}

// main();

drawGraphPng(graph, "breakpoints.png");
