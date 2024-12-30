import type { GraphRouter, GraphServerConfiguration } from "@/server/types.ts";
import { Hono } from "hono";
import { stream } from "hono/streaming";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { GRAPH_REGISTRY } from "../registry";
import type { GraphManager } from "@/core";

export const threadRunsRouter = <GraphSpec extends GraphServerConfiguration>(
    graphSpec: GraphSpec,
) => {
    const router = new Hono()
        // Run Graph with Initial State
        .post(
            "/run/:threadId",
            zValidator(
                "param",
                z.object({
                    threadId: z.string(),
                }),
            ),
            zValidator(
                "json",
                z.object({
                    graph_input: (graphSpec
                        .input_schema as GraphSpec["input_schema"]),
                    config: (graphSpec
                        .config_schema as GraphSpec["config_schema"])
                        .optional(),
                }),
            ),
            async (c) => {
                try {
                    const threadId = c.req.param("threadId");
                    const { state, config } = await c.req.json();
                    const graphManager = GRAPH_REGISTRY.getManager(
                        graphSpec.name,
                    ) as GraphManager<GraphSpec>;

                    const result = await graphManager.invokeGraph({
                        thread_id: threadId,
                        input: state,
                        config,
                    });

                    return c.json(result);
                } catch (error) {
                    c.status(500);
                    throw error;
                }
            },
        )
        // Resume Interrupted Thread
        .post(
            "/run/:threadId/resume",
            zValidator(
                "param",
                z.object({
                    threadId: z.string(),
                }),
            ),
            zValidator(
                "json",
                z.object({
                    resumeValue: z.unknown(),
                    config: (graphSpec
                        .config_schema as GraphSpec["config_schema"])
                        .optional(),
                }),
            ),
            async (c) => {
                try {
                    const threadId = c.req.param("threadId");
                    const { resumeValue, config } = await c.req.json();
                    const graphManager = GRAPH_REGISTRY.getManager(
                        graphSpec.name,
                    ) as GraphManager<GraphSpec>;

                    const result = await graphManager.resumeThreadFromInterrupt(
                        {
                            thread_id: threadId,
                            val: resumeValue,
                            config,
                        },
                    );

                    return c.json(result);
                } catch (error) {
                    c.status(500);
                    throw error;
                }
            },
        )
        // Stream Graph with Initial State
        .post(
            "/stream/:threadId",
            zValidator(
                "param",
                z.object({
                    threadId: z.string(),
                }),
            ),
            zValidator(
                "json",
                z.object({
                    graph_input: graphSpec
                        .input_schema as GraphSpec["input_schema"],
                    config: (graphSpec
                        .config_schema as GraphSpec["config_schema"])
                        .optional(),
                }),
            ),
            async (c) => {
                try {
                    const threadId = c.req.param("threadId");
                    const { graph_input, config } = await c.req.json();
                    const graphManager = GRAPH_REGISTRY.getManager(
                        graphSpec.name,
                    ) as GraphManager<GraphSpec>;

                    return stream(c, async (stream) => {
                        const graphStream = graphManager.streamGraph({
                            thread_id: threadId,
                            input: graph_input,
                            config,
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
        )
        // Resume Interrupted Thread Stream
        .post(
            "/stream/:threadId/resume",
            zValidator(
                "param",
                z.object({
                    threadId: z.string(),
                }),
            ),
            zValidator(
                "json",
                z.object({
                    resumeValue: z.unknown(),
                    config: (graphSpec
                        .config_schema as GraphSpec["config_schema"])
                        .optional(),
                }),
            ),
            async (c) => {
                try {
                    const threadId = c.req.param("threadId");
                    const { resumeValue, config } = await c.req.json();
                    const graphManager = GRAPH_REGISTRY.getManager(
                        graphSpec.name,
                    ) as GraphManager<GraphSpec>;

                    return stream(c, async (stream) => {
                        const graphStream = graphManager
                            .resumeThreadFromInterrupt({
                                thread_id: threadId,
                                val: resumeValue,
                                stream: true,
                                config,
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

    return router;
};
