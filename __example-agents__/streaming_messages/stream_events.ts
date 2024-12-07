import { MemorySaver } from "@langchain/langgraph";
import { graph, GraphStateAnnotation } from "./graph.js";

const input: typeof GraphStateAnnotation.State = {
  messages: [],
  count: 0,
  messages2: [],
};

const config = {
  configurable: {
    thread_id: "stream_events",
  },
  version: "v2" as const,
};

graph.checkpointer = new MemorySaver();
const stream = graph.streamEvents(input, {
  ...config,
  // streamMode: [],
  streamMode: ["messages"],
  // streamMode: ["values", "messages"],
});

for await (const event of stream) {
  if (event.event == "on_chain_stream") {
    console.log(event.tags);
  }
  if (event.event == "on_chat_model_stream" && false) {
    console.dir(
      {
        event: event.event,
        tags: event.tags,
        chunk: event.data.chunk.content,
        chunkName: event.data.chunk.name,
      },
      { depth: 3 },
    );
  }
}

const finalState = await graph.getState(config);
console.log(finalState);
