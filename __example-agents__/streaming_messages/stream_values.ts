import { graph } from "./graph.js";

const input = {
  messages: {
    role: "user",
    content: "Tell me about who you are",
  },
};

const config = {
  configurable: {
    thread_id: "stream_values",
  },
  streamMode: ["values" as const],
};

const stream = await graph.stream(input, config);

for await (const [event, data] of stream) {
  console.log("Evernt : ", event, data);
}
