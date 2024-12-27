import type { GraphRouter, GraphServerConfiguration } from "@/server/types.ts";
import { Hono } from "hono";
import * as handlers from "./assistants.handlers.ts";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const assistantsRouter: GraphRouter = (graphSpec) => {
  const router = new Hono();

  router.get(
    "/",
    zValidator("query", z.object({ name: z.string() })),
    handlers.listAllGraphAssistants(graphSpec),
  );

  // .openapi(
  //   routes.listAllGraphAssistants(graphSpec),
  //   handlers.listAllGraphAssistants(graphSpec.),
  // )
  // .openapi(
  //   routes.createGraphAssistant(graphSpec),
  //   handlers.createAssistant(graphSpec),
  // )
  // .openapi(
  //   routes.getGraphAssistant(graphSpec),
  //   handlers.getGraphAssistant(graphSpec),
  // );

  return router;
};
