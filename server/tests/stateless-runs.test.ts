import {
    TEST_GRAPH_APP,
    type TestGraphServerSpec,
} from "@/__testing/example-graph/server";
import { getClient } from "../custom-client";

// Start the server
Bun.serve({
    port: 8080,
    fetch: TEST_GRAPH_APP.fetch,
});

const client = getClient<TestGraphServerSpec>(
    "http://localhost:8080/test-graph/",
);

console.log("Listening on http://localhost:8080");

const foo = await client.runStateless({
    param: {
        config: {
            config_value: "hello",
        },
        graph_input: {
            input: {
                content: "hello",
            },
        },
    },
});

console.log(foo.body);
