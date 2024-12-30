import { CreateGraphSpecification } from "@/core/graph";
import { getLLM } from "@/lib/models/loadLLM";
import { type LangGraphRunnableConfig, StateGraph } from "@langchain/langgraph";
import { ConfigurationAnnotation, defaultConfig } from "./config";
import {
    InputAnnotation,
    OutputAnnotation,
    streamStateKeys,
    TotalStateAnnotation,
} from "./state";

/* NODES */
async function callModel(
    state: typeof TotalStateAnnotation.State,
    config: LangGraphRunnableConfig<
        typeof ConfigurationAnnotation.State
    >,
): Promise<typeof TotalStateAnnotation.Update> {
    console.log("Beginning Test Stream Process...");
    const llm = getLLM("qwen2_5__05b");
    await llm.invoke(state.messages ?? [], {
        tags: ["messages"], // tagged as state stream key
    });
    console.log("Stream Process Complete");
    return {
        // messages: [result],
        count: (state.count ?? 0) + 1,
    };
}

/* GRAPH */
const workflow = new StateGraph(
    {
        input: InputAnnotation,
        output: OutputAnnotation,
    },
    ConfigurationAnnotation,
)
    // nodes
    .addNode("callModel", callModel)
    // edges
    .addEdge("__start__", "callModel")
    // conditional edges (routers)
    .addEdge("callModel", "__end__");

export const graphSpecification = CreateGraphSpecification({
    workflow,
    name: "test_graph",
    config_annotation: ConfigurationAnnotation,
    input_annotation: InputAnnotation,
    output_annotation: OutputAnnotation,
    default_config: defaultConfig,
    state_llm_stream_keys: streamStateKeys,
});
