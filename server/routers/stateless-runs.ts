import type { GraphRouter, GraphServerConfiguration } from "@/server/types.ts";
import { Hono } from "hono";

export const statelessRunsRouter: GraphRouter = (
    graphSpec: GraphServerConfiguration,
) => {
    const router = new Hono();

    return router;
};
