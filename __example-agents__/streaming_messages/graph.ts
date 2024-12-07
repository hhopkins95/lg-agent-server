import { getLLM } from "@/lib/models/loadLLM";
import { NamedMessageAnnotation } from "@/lib/states/named-messages";
import {
  Annotation,
  END,
  MessagesAnnotation,
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
const GraphStateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  ...NamedMessageAnnotation("otherMessages").spec,
  count: Annotation<number | null>, // example number property -- counts how many times the model has been called
});

const callModel = async (state: typeof GraphStateAnnotation.State) => {
  const { messages } = state;

  const llm = getLLM("claude3_5");

  console.log("------------ start ------------");
  const result = await llm.invoke(messages, { tags: ["MESSAGES"] });
  const result2 = await llm.invoke(messages, { tags: ["MESSAGES__2"] });
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
