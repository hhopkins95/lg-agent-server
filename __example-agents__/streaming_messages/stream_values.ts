import { HumanMessage } from "@langchain/core/messages";
import { graph, GraphStateAnnotation } from "./graph.js";

let input: typeof GraphStateAnnotation.State = {
  messages: [new HumanMessage("What are some sweet psychological thrillers?")],
  messages2: [new HumanMessage("What are some sweet psychological thrillers?")],
  count: 0,
};

const config = {
  configurable: {
    thread_id: "stream_values",
  },
  streamMode: ["values" as const, "messages" as const],
};

const stream = await graph.stream(input, config);

let has_logged_first = false;
let message1Stream = "";
let message2Stream = "";

/**
 * notes :
 *
 * - use tags in the llm call to determine which message is being streamed back.
 *
 * - can implement logic in the stream call to determine whether or not that streamed chunk is part of the state, and should be sent back along with the state, or is some other llm data (that could be used as an intermediate value -- not directly written to the state object)
 *
 * can add 'streamMode' , 'streamStateTags', and 'streamOtherTags' as parts of the graph config that can be used by the client
 */

for await (const [event, data] of stream) {
  if (event == "messages") {
    const [message, meta] = data;
    const chunk = message.content as string;
    const tags = meta.tags as string[];
    // llm chunk has been streamed
    // tags.includes("messages") && console.log({ chunk, tags });

    if (tags.includes("messages")) {
      message1Stream += chunk;
    }
    if (tags.includes("messages2")) {
      message2Stream += chunk;
    }

    // if (!has_logged_first) {
    //   has_logged_first = true;
    //   console.log({ chunk, tags }, { data }, { meta });
    // }

    // if (chunk.length > 30) {
    //   console.log("last chunk", { data }, { meta });
    // }
  }

  if (event == "values") {
    // state has been updated
    let _data = data as typeof input;
    console.log("State Update : ", _data);
  }
}

console.log("message1Stream", message1Stream);
console.log("message2Stream", message2Stream);
