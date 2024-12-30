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
const res = await client.getAllAssistants();

console.log(res.assistants[0].config);
