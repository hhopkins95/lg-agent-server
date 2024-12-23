import type { TGraphDef } from "../../../core/types.ts";
import { type AppRouteHandler } from "../../lib/hono/types.ts";
import type {
  CreateAssistantRoute,
  GetAssistantRoute,
  ListAssistantsRoute,
} from "./assistants.routes.ts";
import { GRAPH_REGISTRY } from "../../registry.ts";

export const listAllGraphAssistants = (
  graph: TGraphDef,
): AppRouteHandler<ListAssistantsRoute> => {
  return async (c) => {
    const manager = GRAPH_REGISTRY.getManager(graph.name);
    const assistants = await manager.listAllAssistants();
    return c.json(assistants, 200);
  };
};

export const createAssistant = (
  graph: TGraphDef,
): AppRouteHandler<CreateAssistantRoute> => {
  return async (c) => {
    const manager = GRAPH_REGISTRY.getManager(graph.name);
    const body = await c.req.json();

    const assistant = {
      graph_name: graph.name,
      description: body.description,
      metadata: body.metadata,
      config: body.config,
    };

    const createdAssistant = await manager.createAssistant(assistant);
    return c.json(createdAssistant, 201);
  };
};

export const getGraphAssistant = (
  graph: TGraphDef,
): AppRouteHandler<GetAssistantRoute> => {
  return async (c) => {
    const manager = GRAPH_REGISTRY.getManager(graph.name);
    const { assistant_id } = c.req.param();
    const assistant = await manager.getAssistant(assistant_id);

    if (!assistant) {
      return c.json({
        error: {
          message: "Assistant not found",
          code: "not_found",
        },
      }, 404);
    }

    return c.json(assistant, 200);
  };
};
