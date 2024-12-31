import type { GraphManager } from "@agent-toolkit/core";
import type { GraphServerConfiguration } from "../types.ts";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { GRAPH_REGISTRY } from "../registry";

export const assistantsRouter = <
    GraphSpec extends GraphServerConfiguration,
>(
    graphSpec: GraphSpec,
) => {
    const router = new Hono()
        // Get All Assistants
        .get(
            "/",
            async (c) => {
                try {
                    const graphManager = GRAPH_REGISTRY.getManager(
                        graphSpec.name,
                    ) as GraphManager<GraphSpec>;
                    const all_assistants = await graphManager
                        .listAllAssistants();
                    return c.json({
                        assistants: all_assistants,
                    });
                } catch (error) {
                    c.status(500);
                    throw error;
                }
            },
        )
        // Get Single Assistant
        .get(
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
                    const graphManager = GRAPH_REGISTRY.getManager(
                        graphSpec.name,
                    ) as GraphManager<GraphSpec>;
                    const assistant = await graphManager.getAssistant(id);
                    return c.json({ assistant });
                } catch (error) {
                    c.status(500);
                    throw error;
                }
            },
        )
        // Create Assistant
        .post(
            "/",
            zValidator(
                "json",
                z.object({
                    graph_name: z.string(),
                    description: z.string().optional(),
                    metadata: z.record(z.unknown()).optional(),
                    config: graphSpec
                        .config_schema as GraphSpec["config_schema"],
                }),
            ),
            async (c) => {
                try {
                    const body = await c.req.json();
                    const graphManager = GRAPH_REGISTRY.getManager(
                        graphSpec.name,
                    ) as GraphManager<GraphSpec>;
                    const assistant = await graphManager.createAssistant(body);
                    return c.json({
                        assistant,
                    });
                } catch (error) {
                    c.status(500);
                    throw error;
                }
            },
        )
        // Update Assistant
        .put(
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
                    config: graphSpec
                        .config_schema as GraphSpec["config_schema"],
                }),
            ),
            async (c) => {
                try {
                    const id = c.req.param("id");
                    const updates = await c.req.json();
                    const graphManager = GRAPH_REGISTRY.getManager(
                        graphSpec.name,
                    ) as GraphManager<GraphSpec>;
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
