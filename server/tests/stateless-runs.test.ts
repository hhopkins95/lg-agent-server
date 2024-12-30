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

// Using raw client method (requires manual .json() call)
const res = await (await client.runStateless({
    json: {
        config: {
            config_value: "",
        },
    },
})).json();

// Using wrapped method (handles json parsing automatically)
const res2 = await client.runStateless2({
    json: {
        config: {
            config_value: "",
        },
    },
});

console.log(res);
// const foo = await client["stateless-runs"].run.$get({

// console.log(foo.body);
