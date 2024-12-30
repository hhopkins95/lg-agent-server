// TODO -- write actual tests

// import {
//     TEST_GRAPH_APP,
//     type TestGraphServerSpec,
//     type TestServerHonoType,
// } from "@/__testing/example-graph/server";
// import { getGraphClient } from "../custom-client";
// import { hc } from "hono/client";

// // Start the server
// Bun.serve({
//     port: 8080,
//     fetch: TEST_GRAPH_APP.fetch,
// });

// const client = getGraphClient<TestGraphServerSpec>(
//     "http://localhost:8080/test-graph/",
// );

// console.log("Listening on http://localhost:8080");

// // Using wrapped method (handles json parsing automatically)
// const res = await client.runStateless({
//     json: {
//         graph_input: {
//             message_input: {
//                 content: "Hello",
//             },
//         },
//     },
// });

// console.log(res.values?.messages);
