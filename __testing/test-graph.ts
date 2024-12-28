import {
    Annotation,
    type LangGraphRunnableConfig,
    MessagesAnnotation,
    StateGraph,
} from "@langchain/langgraph";

import { CreateGraphDef } from "@/core/graph";
import { getLLM } from "@/lib/models/loadLLM";

//  CONFIGURATION
const GraphConfigurationAnnotation = Annotation.Root({
    config_value: Annotation<string>(),
});
const defaultConfig: typeof GraphConfigurationAnnotation.State = {
    config_value: "default_config",
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

const defaultState: typeof GraphStateAnnotation.State = {
    count: 0,
    messages: [],
};

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
    console.log("Stream Process Complete");
    return {
        count: state.count + 1,
        messages: result,
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

const graph = workflow.compile({
    // checkpointer: new MemorySaver(),
});

export const GraphDefinition = CreateGraphDef({
    graph,
    name: "test_graph",
    config_annotation: GraphConfigurationAnnotation,
    input_annotation: GraphStateAnnotation,
    output_annotation: GraphStateAnnotation,
    default_config: defaultConfig,
    state_llm_stream_keys: streamStateKeys,
});
