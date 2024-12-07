import { getLLM } from "@/lib/models/loadLLM";
import { CustomMessagesAnnotation } from "@/lib/states/messages";
import { BaseMessage } from "@langchain/core/messages";
import {
  Annotation,
  END,
  // MessagesAnnotation,
  messagesStateReducer,
  START,
  StateGraph,
} from "@langchain/langgraph";

// State
export const GraphStateAnnotation = Annotation.Root({
  messages: CustomMessagesAnnotation,
  messages2: CustomMessagesAnnotation,
  count: Annotation<number>, // example number property -- counts how many times the model has been called
});

type StateKeys = keyof typeof GraphStateAnnotation.State;

const StateLLMStreamKeys: Record<string, StateKeys> = {
  messages: "messages",
  messages2: "messages2",
} as const; // LLM streams that are directly written to the state

const OtherLLMStreamKeys = {
  fooCall: "fooCall",
} as const; // Other LLM calls that want to be streamed back to the client

// Node
const callModel = async (state: typeof GraphStateAnnotation.State) => {
  const { messages, messages2 } = state;

  const llm = getLLM("llama3_2__3b");

  console.log("------------ start ------------");
  const result = await llm.invoke(messages, {
    tags: [OtherLLMStreamKeys.fooCall],
  });
  const result2 = await llm.invoke(messages2, {
    tags: [StateLLMStreamKeys.messages2],
  });
  const fooCall = await llm.invoke(messages, {
    tags: [OtherLLMStreamKeys.fooCall],
  });
  console.log("------------ end ------------");

  return { messages: [result], count: Math.random() };
};

const workflow = new StateGraph(GraphStateAnnotation)
  .addNode("agent", callModel)
  .addEdge(START, "agent")
  .addEdge("agent", END);

export const graph = workflow.compile();
