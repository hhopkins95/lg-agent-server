import {
    TEST_GRAPH_APP,
    type TestGraphServerSpec,
    type TestServerHonoType,
} from "@/__testing/example-graph/server";
import { getClient } from "../custom-client";
import { hc } from "hono/client";

// Start the server
Bun.serve({
    port: 8080,
    fetch: TEST_GRAPH_APP.fetch,
});

const client = getClient<TestGraphServerSpec>(
    "http://localhost:8080/test-graph/",
);

console.log("Listening on http://localhost:8080");

// Using wrapped method (handles json parsing automatically)
const res = await client.runStateless({
    json: {
        graph_input: {
            message_input: {
                content: "",
            },
        },
    },
});

const stream = await client.streamStateless({
    json: {
        state: {
            message_input: {
                content: "Hello there. What is your name?",
            },
        },
    },
});

console.log(res);

for await (const chunk of stream) {
    if (chunk.state_llm_stream_data) {
        console.log("Streamed : ", chunk.state_llm_stream_data.chunkContent);
    } else if (chunk.full_state_update) {
        console.log("Full state update : ", chunk.full_state_update);
    } else {
        console.log("SOMETHING ELSE");
    }
}

// const foo = await client["stateless-runs"].run.$get({

// console.log(foo.body);
