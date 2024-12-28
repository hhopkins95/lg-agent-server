import {
    Annotation,
    type LangGraphRunnableConfig,
    MessagesAnnotation,
    StateGraph,
} from "@langchain/langgraph";
import { CreateGraphSpecification } from "@/core/graph";
import { getLLM } from "@/lib/models/loadLLM";
import { z } from "zod";
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { CustomMessagesAnnotation } from "@/lib";

//  CONFIGURATION
const GraphConfigurationAnnotation = Annotation.Root({
    config_value: Annotation<string>(),
});
const defaultConfig: typeof GraphConfigurationAnnotation.State = {
    config_value: "default_config",
};

// STATE
const GraphStateAnnotation = Annotation.Root({
    messages: CustomMessagesAnnotation,
    count: Annotation<number>, // example number property -- counts how many times the model has been called
});

const streamStateKeys: Array<keyof typeof GraphStateAnnotation.State> = [
    "messages",
];

// GraphStateAnnotation.State.messages[0].

const MessageSchema = z.object({
    content: z.string(),
    role: z.enum(["user", "assistant"]),
});

const GraphStateSchema = z.object({
    messages: z.array(MessageSchema),
    count: z.number(),
});

/* NODES */
async function callModel(
    state: typeof GraphStateAnnotation.State,
    runnableConfig: LangGraphRunnableConfig<
        typeof GraphConfigurationAnnotation.State
    >,
): Promise<typeof GraphStateAnnotation.Update> {
    console.log("Beginning Stream Process...");
    const llm = getLLM("qwen2_5__05b");
    const result = await llm.invoke(state.messages, {
        tags: ["messages"],
    });
    const foo = result.content;
    console.log("Stream Process Complete");
    return {
        count: state.count + 1,
    };
}

/* GRAPH */
const workflow = new StateGraph(
    GraphStateAnnotation,
    GraphConfigurationAnnotation,
)
    // nodes
    .addNode("callModel", callModel)
    // edges
    .addEdge("__start__", "callModel")
    // conditional edges (routers)
    .addEdge("callModel", "__end__");

const graph = workflow.compile();

export const GraphDefinition = CreateGraphSpecification({
    graph,
    name: "test_graph",
    config_annotation: GraphConfigurationAnnotation,
    input_annotation: GraphStateAnnotation,
    output_annotation: GraphStateAnnotation,
    default_config: defaultConfig,
    state_llm_stream_keys: streamStateKeys,
});
