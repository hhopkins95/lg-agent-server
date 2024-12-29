import type { GraphRouter, GraphServerConfiguration } from "@/server/types.ts";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { GRAPH_REGISTRY } from "../registry";
import type { GraphManager } from "@/core";

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
                    state: graphSpec.input_schema as GraphSpec["input_schema"],
                    resumeValue: z.unknown().optional(),
                    config: graphSpec
                        .config_schema as GraphSpec["config_schema"],
                    assistant_id: z.string().optional(),
                }),
            ),
            async (c) => {
                try {
                    const { state, resumeValue, config, assistant_id } = await c
                        .req
                        .json();
                    const graphManager = GRAPH_REGISTRY.getManager(
                        graphSpec.name,
                    ) as GraphManager<GraphSpec>;

                    const result = await graphManager.invokeGraph({
                        state,
                        resumeValue,
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
        .get(
            "/stream",
            zValidator(
                "json",
                z.object({
                    state: graphSpec.input_schema as GraphSpec["input_schema"],
                    resumeValue: z.unknown().optional(),
                    config: graphSpec
                        .config_schema as GraphSpec["config_schema"],
                    assistant_id: z.string().optional(),
                }).refine((data) => !(data.state && data.resumeValue), {
                    message: "Cannot provide both state and resumeValue",
                }),
            ),
            async (c) => {
                try {
                    const { state, resumeValue, config, assistant_id } = await c
                        .req
                        .json();
                    const graphManager = GRAPH_REGISTRY.getManager(
                        graphSpec.name,
                    ) as GraphManager<GraphSpec>;

                    return streamSSE(c, async (stream) => {
                        const graphStream = graphManager.streamGraph({
                            state,
                            resumeValue,
                            config,
                            assistant_id,
                        });

                        for await (const update of graphStream) {
                            await stream.writeSSE({
                                data: JSON.stringify(update),
                            });
                        }
                    }, async (err, stream) => {
                        console.error(err);
                        await stream.writeSSE({
                            data: JSON.stringify({ error: err.message }),
                            event: "error",
                        });
                    });
                } catch (error) {
                    c.status(500);
                    throw error;
                }
            },
        );
};
