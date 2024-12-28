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

const graph = workflow.compile();

export const graphSpecification = CreateGraphSpecification({
    graph,
    name: "test_graph",
    config_annotation: ConfigurationAnnotation,
    input_annotation: InputAnnotation,
    output_annotation: OutputAnnotation,
    default_config: defaultConfig,
    state_llm_stream_keys: streamStateKeys,
});
