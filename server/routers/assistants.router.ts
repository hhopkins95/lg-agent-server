import type { GraphRouter } from "@/server/types.ts";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { GRAPH_REGISTRY } from "../registry";

export const assistantsRouter: GraphRouter = (graphSpec) => {
    const router = new Hono();

    // Get All Assistants
    router.get(
        "/",
        async (c) => {
            try {
                const graphManager = GRAPH_REGISTRY.getManager(graphSpec.name);
                const all_assistants = await graphManager.listAllAssistants();
                return c.json({
                    assistants: all_assistants,
                });
            } catch (error) {
                c.status(500);
                throw error;
            }
        },
    );

    // Get Single Assistant
    router.get(
        "/:id",
        zValidator(
            "param",
            z.object({
                id: z.string(),
            }),
        ),
        async (c) => {
            try {
                const id = c.req.param("id");
                const graphManager = GRAPH_REGISTRY.getManager(graphSpec.name);
                const assistant = await graphManager.getAssistant(id);
                return c.json({
                    assistant,
                });
            } catch (error) {
                c.status(500);
                throw error;
            }
        },
    );

    // Create Assistant
    router.post(
        "/",
        zValidator(
            "json",
            z.object({
                graph_name: z.string(),
                description: z.string().optional(),
                metadata: z.record(z.unknown()).optional(),
                config: z.record(z.unknown()),
            }),
        ),
        async (c) => {
            try {
                const body = await c.req.json();
                const graphManager = GRAPH_REGISTRY.getManager(graphSpec.name);
                const assistant = await graphManager.createAssistant(body);
                return c.json({
                    assistant,
                });
            } catch (error) {
                c.status(500);
                throw error;
            }
        },
    );

    // Update Assistant
    router.put(
        "/:id",
        zValidator(
            "param",
            z.object({
                id: z.string(),
            }),
        ),
        zValidator(
            "json",
            z.object({
                description: z.string().optional(),
                metadata: z.record(z.unknown()).optional(),
                config: z.record(z.unknown()).optional(),
            }),
        ),
        async (c) => {
            try {
                const id = c.req.param("id");
                const updates = await c.req.json();
                const graphManager = GRAPH_REGISTRY.getManager(graphSpec.name);
                const assistant = await graphManager.updateAssistant(
                    id,
                    updates,
                );
                if (!assistant) {
                    c.status(404);
                    return c.json({
                        error: `Assistant ${id} not found`,
                    });
                }
                return c.json({
                    assistant,
                });
            } catch (error) {
                c.status(500);
                throw error;
            }
        },
    );

    return router;
};
