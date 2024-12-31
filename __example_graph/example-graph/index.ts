import { CreateGraphSpecification } from "@agent-toolkit/core";
import { getLLM } from "@agent-toolkit/lib/models";
import { type LangGraphRunnableConfig, StateGraph } from "@langchain/langgraph";
import { ConfigurationAnnotation, defaultConfig } from "./config";
import {
    InputAnnotation,
    OutputAnnotation,
    streamStateKeys,
    TotalStateAnnotation,
} from "./state";
import { HumanMessage } from "@langchain/core/messages";

/* NODES */
async function callModel(
    state: typeof TotalStateAnnotation.State,
    config: LangGraphRunnableConfig<
        typeof ConfigurationAnnotation.State
    >,
): Promise<typeof TotalStateAnnotation.Update> {
    console.log("Beginning Test Stream Process...");
    const llm = getLLM("claude3_5");
    const input = state.message_input.content;
    console.log("Input: ", input);
    const result = await llm.invoke([new HumanMessage(input)], {
        tags: ["messages"], // tagged as state stream key
    });
    console.log("Stream Process Complete");

    return {
        messages: [result],
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
