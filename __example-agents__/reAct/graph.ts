import { BunSqliteSaver } from "@/lib/checkpointers/bun-sqlite";
import { getLLM } from "@/lib/models/loadLLM";
import { type AllModelKeys } from "@/lib/models/models-registry";
import { ensureGraphConfiguration } from "@/lib/utils/get-graph-config";
import { interruptGraph } from "@/lib/utils/interrupt-graph";
import { tool } from "@langchain/core/tools";
import {
  Annotation,
  Command,
  CompiledStateGraph,
  END,
  interrupt,
  type LangGraphRunnableConfig,
  MessagesAnnotation,
  StateGraph,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { z } from "zod";

//  CONFIGURATION
const GraphConfigurationAnnotation = Annotation.Root({
  model: Annotation<AllModelKeys>,
});
const defaultConfig: typeof GraphConfigurationAnnotation.State = {
  model: "llama3_2__3b",
};

// STATE
const GraphStateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  count: Annotation<number>, // example number property -- counts how many times the model has been called
});

const inputKeys: Array<keyof typeof GraphStateAnnotation.State> = ["messages"]; // potentially used downstream for clients
const outputKeys: Array<keyof typeof GraphStateAnnotation.State> = [
  "count",
  "messages",
]; // potentially used downstream for clients

const streamStateKeys: Array<keyof typeof GraphStateAnnotation.State> = [
  "messages",
];

const otherStreamKeys = ["abc"];

const defaultState: typeof GraphStateAnnotation.State = {
  count: 0,
  messages: [],
};

/* TOOLS */
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

/* NODES */
const tools = [addNumbersTool];
const toolNode = new ToolNode(tools);

async function callModel(
  state: typeof GraphStateAnnotation.State,
  runnableConfig: LangGraphRunnableConfig<
    typeof GraphConfigurationAnnotation.State
  >,
): Promise<typeof GraphStateAnnotation.Update> {
  console.log("Mock Long running process start...");

  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log("Mock Long running process end...");
  return {
    count: state.count + 1,
    messages: state.messages,
  };

  const c = ensureGraphConfiguration(runnableConfig, defaultConfig); // if c is not defined, create it with defaults
  const llm = getLLM(c.model!); // .bindTools(tools);
  console.log("Interrupting graph...");
  const response = await interruptGraph({
    query: "1! What should the new count be",
  }, runnableConfig);
  console.log("Value from interrupt", response);
  const response2 = await interrupt("2! What should the new count be");
  console.log("Value from interrupt 2", response2);

  const curCount = state.count;
  if (curCount === undefined || curCount === null) {
    throw new Error("count is not found");
  }
  const messages = state.messages ?? [];

  const res = await llm.invoke(messages, {
    tags: ["messages"],
  });

  return {
    messages: res,
    count: curCount + 1,
  };
}

const router = (state: typeof GraphStateAnnotation.State) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];
  if (
    lastMessage &&
    "tool_calls" in lastMessage && Array.isArray(lastMessage.tool_calls) &&
    lastMessage.tool_calls?.length
  ) {
    return "tools";
  }
  return END;
}; // Determines whether or not to call the tool node, or to end the graph after the 'callModel' node

/* GRAPH */
const workflow = new StateGraph(
  GraphStateAnnotation,
  GraphConfigurationAnnotation,
)
  // nodes
  .addNode("callModel", callModel)
  .addNode("tools", toolNode)
  // edges
  .addEdge("__start__", "callModel")
  .addEdge("tools", "callModel")
  // conditional edges (routers)
  .addConditionalEdges(
    "callModel",
    router,
    [END, "tools"],
  );

const graph = workflow.compile({
  // checkpointer: new MemorySaver(),
});

// Testing -- CLINE IGNORE THIS
import { CreateGraphDef } from "@/core/graph";
export const GraphDefinition = CreateGraphDef({
  graph,
  name: "test_graph",
  config_annotation: GraphConfigurationAnnotation,
  state_annotation: GraphStateAnnotation,
  default_config: defaultConfig,
  default_state: defaultState,
  input_keys: inputKeys,
  output_keys: outputKeys,
  state_llm_stream_keys: streamStateKeys,
  other_llm_stream_keys: otherStreamKeys,
});

const main = async () => {
  const db_path = __dirname + "/test.db";
  const cp = await BunSqliteSaver.fromConnString(db_path);
  graph.checkpointer = cp; // MemorySaver();

  const config = {
    configurable: { thread_id: "abcde", model: "qwen2_5__05b" as const },
  };

  const state0 = await graph.getState(config);
  console.log("Initial Next", state0.next);
  console.log("Initial Tasks", state0.tasks);
  console.log("Initial Values", state0.values);

  graph.invoke({}, config).catch((e) => {
    console.log("Caught Error");
  });
  await new Promise((resolve) => setTimeout(resolve, 100));
  const state = await graph.getState(config);
  console.log("During Next", state.next);
  console.log("During Tasks", state.tasks);
  console.log("During Values", state.values);

  const state2 = await graph.getState(config);

  console.log("Next", state2.next);
  console.log("Tasks", state2.tasks);
  console.log("Values", state2.values);

  return;
  await graph.invoke({}, config);
  const newState = await graph.getState(config);
  console.log("After Next", newState.next);
  console.log("After Tasks", newState.tasks);
  console.log("After Values", newState.values);

  // First invocation
  // const stream = await graph.stream({}, {
  //   ...config,
  //   streamMode: ["custom"],
  // });

  // for await (const [eventType, data] of stream) {
  //   console.log("EVENT", eventType);
  //   console.log("DATA", data);
  // }
  return;
  await graph.invoke({}, config);
  await graph.invoke(
    new Command({ resume: { hello: "world", foo: "bar" } }),
    config,
  );
  printGraphState(graph, "abc", "1");

  // printGraphState(graph, "abc", "4");
};

const printGraphState = async (
  graph: CompiledStateGraph<any, any, any, any>,
  threadId: string,
  key?: string,
) => {
  const state = await graph.getState({ configurable: { thread_id: threadId } });
  console.log(`STATE ${key ?? ""} :: `, {
    state, //: state.tasks[0],
  });
};

main();
