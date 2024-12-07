import { getLLM } from "@/lib/models/loadLLM";
import { MessagesAnnotation } from "@/lib/states/messages";
import { BaseMessage } from "@langchain/core/messages";
import {
  Annotation,
  END,
  // MessagesAnnotation,
  messagesStateReducer,
  START,
  StateGraph,
} from "@langchain/langgraph";

/**
 * MessagesAnnotation is a pre-built state annotation imported from @langchain/langgraph.
 * It is the same as the following annotation:
 *
 * ```typescript
 * const MessagesAnnotation = Annotation.Root({
 *   messages: Annotation<BaseMessage[]>({
 *     reducer: messagesStateReducer,
 *     default: () => [systemMessage],
 *   }),
 * });
 * ```
 */
const foo = Annotation<BaseMessage[]>({
  reducer: messagesStateReducer,
});

export const GraphStateAnnotation = Annotation.Root({
  messages: MessagesAnnotation,
  messages2: MessagesAnnotation,
  count: Annotation<number>, // example number property -- counts how many times the model has been called
});

const callModel = async (state: typeof GraphStateAnnotation.State) => {
  const { messages, messages2 } = state;

  const llm = getLLM("llama3_1__70b");

  console.log("------------ start ------------");
  const result = await llm.invoke(messages, { tags: ["messages"] });
  const result2 = await llm.invoke(messages2, { tags: ["messages2"] });
  console.log("------------ end ------------");

  return { messages: [result], count: Math.random() };
};

const workflow = new StateGraph(GraphStateAnnotation)
  .addNode("agent", callModel)
  .addEdge(START, "agent")
  .addEdge("agent", END);

export const graph = workflow.compile({
  // The LangGraph Studio/Cloud API will automatically add a checkpointer
  // only uncomment if running locally
  // checkpointer: new MemorySaver(),
});
