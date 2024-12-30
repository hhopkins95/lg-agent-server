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
            input: {
                content: "",
            },
        },
    },
});

console.log(res);
// const foo = await client["stateless-runs"].run.$get({

// console.log(foo.body);
