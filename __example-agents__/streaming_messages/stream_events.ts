import { MemorySaver } from "@langchain/langgraph";
import { graph } from "./graph.js";

const input = {
  messages: {
    role: "user",
    content: "What is the current stock price of $AAPL?",
  },
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
  streamMode: "updates",
});

for await (const event of stream) {
  console.log(event.event);

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
