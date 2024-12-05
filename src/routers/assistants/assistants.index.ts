import { GraphRouterGenerator } from "../../../core/types_old.ts";
import { createRouter } from "../../../server/lib/hono/create-base-app.ts";
import * as handlers from "./assistants.handlers.ts";
import * as routes from "./assistants.routes.ts";

export const assistantsRouter: GraphRouterGenerator = (graphSpec) => {
  const router = createRouter()
    .openapi(
      routes.listAllGraphAssistants(graphSpec),
      handlers.listAllGraphAssistants(graphSpec),
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
