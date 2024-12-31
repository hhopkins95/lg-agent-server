import type { GraphManager } from "@agent-toolkit/core";
import type { GraphServerConfiguration } from "../types.ts";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { stream } from "hono/streaming";
import { z } from "zod";
import { GRAPH_REGISTRY } from "../registry";

export const statelessRunsRouter = <
    GraphSpec extends GraphServerConfiguration,
>(
    graphSpec: GraphSpec,
) => {
    return new Hono()
        // Run Graph
        .post(
            "/run",
            zValidator(
                "json",
                z.object({
                    graph_input: (graphSpec
                        .input_schema as GraphSpec["input_schema"]),
                    config: (graphSpec
                        .config_schema as GraphSpec["config_schema"])
                        .optional(),
                    assistant_id: z.string().optional(),
                }),
                (result, c) => {
                    if (!result.success) {
                        return c.text("Invalid!", 400);
                    }
                },
            ),
            async (c) => {
                console.log("running...");
                try {
                    const { assistant_id, config, graph_input } = c.req
                        .valid("json");

                    const graphManager = GRAPH_REGISTRY.getManager(
                        graphSpec.name,
                    ) as GraphManager<GraphSpec>;

                    const result = await graphManager.invokeGraph({
                        input: graph_input,
                        config,
                        assistant_id,
                    });

                    return c.json(result);
                } catch (error) {
                    c.status(500);
                    throw error;
                }
            },
        )
        // Stream Graph
        .post(
            "/stream",
            zValidator(
                "json",
                z.object({
                    state: graphSpec.input_schema as GraphSpec["input_schema"],
                    config: (graphSpec
                        .config_schema as GraphSpec["config_schema"])
                        .optional(),
                    assistant_id: z.string().optional(),
                }),
            ),
            async (c) => {
                try {
                    const { state, config, assistant_id } = await c
                        .req
                        .json();
                    const graphManager = GRAPH_REGISTRY.getManager(
                        graphSpec.name,
                    ) as GraphManager<GraphSpec>;

                    return stream(c, async (stream) => {
                        const graphStream = graphManager.streamGraph({
                            input: state,
                            config,
                            assistant_id,
                        });

                        for await (const update of graphStream) {
                            await stream.write(
                                new TextEncoder().encode(
                                    JSON.stringify(update) + "\n",
                                ),
                            );
                        }
                    }, async (err, stream) => {
                        console.error(err);
                        await stream.write(
                            new TextEncoder().encode(
                                JSON.stringify({ error: err.message }) + "\n",
                            ),
                        );
                    });
                } catch (error) {
                    c.status(500);
                    throw error;
                }
            },
        );
};
