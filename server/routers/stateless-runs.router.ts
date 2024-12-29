import type { GraphRouter, GraphServerConfiguration } from "@/server/types.ts";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { GRAPH_REGISTRY } from "../registry";
import type { GraphManager } from "@/core";

export const statelessRunsRouter = <
    GraphSpec extends GraphServerConfiguration,
>(
    graphSpec: GraphSpec,
    // graphInputSchema: GraphInputSchema,
    // graphConfigSchema: GraphConfigSchema,
) => {
    return new Hono()
        // Run Graph
        .post(
            "/run",
            zValidator(
                "json",
                z.object({
                    state: graphSpec.input_schema as GraphSpec["input_schema"],
                    //          resumeValue: z.unknown().optional(),
                    config: graphSpec
                        .config_schema as GraphSpec["config_schema"],
                    //         assistant_id: z.string().optional(),
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
        );
    // Stream Graph
    // .post(
    //     "/stream",
    //     zValidator(
    //         "json",
    //         z.object({
    //             state: z.record(z.unknown()).optional(),
    //             resumeValue: z.unknown().optional(),
    //             config: z.record(z.unknown()).optional(),
    //             assistant_id: z.string().optional(),
    //         }).refine((data) => !(data.state && data.resumeValue), {
    //             message: "Cannot provide both state and resumeValue",
    //         }),
    //     ),
    //     async (c) => {
    //         try {
    //             const { state, resumeValue, config, assistant_id } = await c
    //                 .req
    //                 .json();
    //             const graphManager = GRAPH_REGISTRY.getManager(
    //                 graphSpec.name,
    //             );

    //             return new Response(
    //                 new ReadableStream({
    //                     async start(controller) {
    //                         try {
    //                             const stream = graphManager.streamGraph({
    //                                 state,
    //                                 resumeValue,
    //                                 config,
    //                                 assistant_id,
    //                             });

    //                             for await (const update of stream) {
    //                                 const data = `data: ${
    //                                     JSON.stringify(update)
    //                                 }\n\n`;
    //                                 controller.enqueue(
    //                                     new TextEncoder().encode(data),
    //                                 );
    //                             }
    //                             controller.close();
    //                         } catch (error) {
    //                             controller.error(error);
    //                         }
    //                     },
    //                 }),
    //                 {
    //                     headers: {
    //                         "Content-Type": "text/event-stream",
    //                         "Cache-Control": "no-cache",
    //                         "Connection": "keep-alive",
    //                     },
    //                 },
    //             );
    //         } catch (error) {
    //             c.status(500);
    //             throw error;
    //         }
    //     },
    // );
};
