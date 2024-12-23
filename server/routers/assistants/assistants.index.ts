import type { GraphServerConfiguration } from "@/server/types.ts";
import { createRouter } from "../../lib/hono/create-base-app.ts";
import * as handlers from "./assistants.handlers.ts";
import * as routes from "./assistants.routes.ts";

export const assistantsRouter = (graphSpec: GraphServerConfiguration) => {
  const router = createRouter()
    .openapi(
      routes.listAllGraphAssistants(graphSpec),
      handlers.listAllGraphAssistants(graphSpec.),
    )
    .openapi(
      routes.createGraphAssistant(graphSpec),
      handlers.createAssistant(graphSpec),
    )
    .openapi(
      routes.getGraphAssistant(graphSpec),
      handlers.getGraphAssistant(graphSpec),
    );

  return {
    router,
    rootPath: "/assistants",
  };
};
