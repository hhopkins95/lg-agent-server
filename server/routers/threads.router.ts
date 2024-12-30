import type { GraphRouter, GraphServerConfiguration } from "@/server/types.ts";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { GRAPH_REGISTRY } from "../registry";
import type { GraphManager } from "@/core";

export const threadsRouter = <GraphSpec extends GraphServerConfiguration>(
    graphSpec: GraphSpec,
) => {
    const router = new Hono()
        // Create Thread
        .post(
            "/:assistantId",
            zValidator(
                "param",
                z.object({
                    assistant_id: z.string(),
                }),
            ),
            async (c) => {
                try {
                    const { assistant_id } = await c.req.valid("param");
                    const graphManager = GRAPH_REGISTRY.getManager(
                        graphSpec.name,
                    ) as GraphManager<typeof graphSpec>;
                    const thread = await graphManager.createThread(
                        assistant_id,
                    );
                    return c.json({
                        thread,
                    });
                } catch (error) {
                    c.status(500);
                    throw error;
                }
            },
        )
        // Get Thread
        .get(
            "/:threadId",
            zValidator(
                "param",
                z.object({
                    threadId: z.string(),
                }),
            ),
            async (c) => {
                try {
                    const { threadId } = await c.req.valid("param");
                    const graphManager: GraphManager<typeof graphSpec> =
                        GRAPH_REGISTRY.getManager(
                            graphSpec.name,
                        ) as GraphManager<typeof graphSpec>;
                    const thread = await graphManager.getThread(threadId);
                    if (!thread) {
                        c.status(404);
                        throw new Error();
                    }
                    return c.json({
                        thread,
                    });
                } catch (error) {
                    c.status(500);
                    throw error;
                }
            },
        )
        // Get All Assistant Threads
        .get(
            "/assistantThreads/:assistantId",
            zValidator(
                "param",
                z.object({
                    assistantId: z.string(),
                }),
            ),
            async (c) => {
                try {
                    const { assistantId } = await c.req.valid("param");
                    const graphManager = GRAPH_REGISTRY.getManager(
                        graphSpec.name,
                    ) as GraphManager<typeof graphSpec>;
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
    return router;
};
