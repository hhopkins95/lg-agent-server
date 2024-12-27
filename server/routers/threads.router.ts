import type { GraphRouter } from "@/server/types.ts";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { GRAPH_REGISTRY } from "../registry";

export const threadsRouter: GraphRouter = (graphSpec) => {
    const router = new Hono();

    // Create Thread
    router.post(
        "/",
        zValidator(
            "json",
            z.object({
                assistant_id: z.string(),
            }),
        ),
        async (c) => {
            try {
                const { assistant_id } = await c.req.json();
                const graphManager = GRAPH_REGISTRY.getManager(graphSpec.name);
                const thread = await graphManager.createThread(assistant_id);
                return c.json({
                    thread,
                });
            } catch (error) {
                c.status(500);
                throw error;
            }
        },
    );

    // Get Thread
    router.get(
        "/:threadId",
        zValidator(
            "param",
            z.object({
                threadId: z.string(),
            }),
        ),
        async (c) => {
            try {
                const threadId = c.req.param("threadId");
                const graphManager = GRAPH_REGISTRY.getManager(graphSpec.name);
                const thread = await graphManager.getThread(threadId);
                if (!thread) {
                    c.status(404);
                    return c.json({
                        error: `Thread ${threadId} not found`,
                    });
                }
                return c.json({
                    thread,
                });
            } catch (error) {
                c.status(500);
                throw error;
            }
        },
    );

    // Get All Assistant Threads
    router.get(
        "/assistantThreads/:assistantId",
        zValidator(
            "param",
            z.object({
                assistantId: z.string(),
            }),
        ),
        async (c) => {
            try {
                const assistantId = c.req.param("assistantId");
                const graphManager = GRAPH_REGISTRY.getManager(graphSpec.name);
                const threads = await graphManager.listThreads({
                    assistant_id: assistantId,
                });
                return c.json({
                    threads,
                });
            } catch (error) {
                c.status(500);
                throw error;
            }
        },
    );

    // Run Graph with Initial State
    router.post(
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
                state: z.record(z.unknown()),
                config: z.record(z.unknown()).optional(),
            }),
        ),
        async (c) => {
            try {
                const threadId = c.req.param("threadId");
                const { state, config } = await c.req.json();
                const graphManager = GRAPH_REGISTRY.getManager(graphSpec.name);

                const result = await graphManager.invokeGraph({
                    thread_id: threadId,
                    state,
                    config,
                });

                return c.json(result);
            } catch (error) {
                c.status(500);
                throw error;
            }
        },
    );

    // Resume Interrupted Thread
    router.post(
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
                config: z.record(z.unknown()).optional(),
            }),
        ),
        async (c) => {
            try {
                const threadId = c.req.param("threadId");
                const { resumeValue, config } = await c.req.json();
                const graphManager = GRAPH_REGISTRY.getManager(graphSpec.name);

                const result = await graphManager.resumeThreadFromInterrupt({
                    thread_id: threadId,
                    val: resumeValue,
                    config,
                });

                return c.json(result);
            } catch (error) {
                c.status(500);
                throw error;
            }
        },
    );

    // Stream Graph with Initial State
    router.post(
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
                state: z.record(z.unknown()),
                config: z.record(z.unknown()).optional(),
            }),
        ),
        async (c) => {
            try {
                const threadId = c.req.param("threadId");
                const { state, config } = await c.req.json();
                const graphManager = GRAPH_REGISTRY.getManager(graphSpec.name);

                return new Response(
                    new ReadableStream({
                        async start(controller) {
                            try {
                                const stream = graphManager.streamGraph({
                                    thread_id: threadId,
                                    state,
                                    config,
                                });

                                for await (const update of stream) {
                                    const data = `data: ${
                                        JSON.stringify(update)
                                    }\n\n`;
                                    controller.enqueue(
                                        new TextEncoder().encode(data),
                                    );
                                }
                                controller.close();
                            } catch (error) {
                                controller.error(error);
                            }
                        },
                    }),
                    {
                        headers: {
                            "Content-Type": "text/event-stream",
                            "Cache-Control": "no-cache",
                            "Connection": "keep-alive",
                        },
                    },
                );
            } catch (error) {
                c.status(500);
                throw error;
            }
        },
    );

    // Resume Interrupted Thread Stream
    router.post(
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
                config: z.record(z.unknown()).optional(),
            }),
        ),
        async (c) => {
            try {
                const threadId = c.req.param("threadId");
                const { resumeValue, config } = await c.req.json();
                const graphManager = GRAPH_REGISTRY.getManager(graphSpec.name);

                return new Response(
                    new ReadableStream({
                        async start(controller) {
                            try {
                                const stream = graphManager
                                    .resumeThreadFromInterrupt({
                                        thread_id: threadId,
                                        val: resumeValue,
                                        stream: true,
                                        config,
                                    });

                                for await (const update of stream) {
                                    const data = `data: ${
                                        JSON.stringify(update)
                                    }\n\n`;
                                    controller.enqueue(
                                        new TextEncoder().encode(data),
                                    );
                                }
                                controller.close();
                            } catch (error) {
                                controller.error(error);
                            }
                        },
                    }),
                    {
                        headers: {
                            "Content-Type": "text/event-stream",
                            "Cache-Control": "no-cache",
                            "Connection": "keep-alive",
                        },
                    },
                );
            } catch (error) {
                c.status(500);
                throw error;
            }
        },
    );

    return router;
};
