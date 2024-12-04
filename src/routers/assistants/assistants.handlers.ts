import { GraphServerConfiguration, GraphServerProp } from "../../types.ts";
import { AppRouteHandler } from "@/lib/hono/types.ts";
import { HTTPException } from "hono/http-exception";
import type {
  CreateAssistantRoute,
  GetAssistantRoute,
  ListAssistantsRoute,
} from "./assistants.routes.ts";
import { GRAPH_REGISTRY } from "../../models/registry.ts";

export const listAllGraphAssistants = (
  graph: GraphServerConfiguration,
): AppRouteHandler<ListAssistantsRoute> => {
  return async (c) => {
    const assistantManager = GRAPH_REGISTRY.getGraphAssistantManager(
      graph.graph_name,
    );
    const assistants = await assistantManager.list();
    return c.json(assistants, 200);
  };
};

export const createAssistant = (
  graph: GraphServerConfiguration,
): AppRouteHandler<CreateAssistantRoute> => {
  return async (c) => {
    const assistantManager = GRAPH_REGISTRY.getGraphAssistantManager(
      graph.graph_name,
    );
    const body = await c.req.json();

    // Generate a unique ID for the assistant
    const assistantId = `asst_${crypto.randomUUID()}`;

    const assistant = {
      id: assistantId,
      graph_name: graph.graph_name,
      description: body.description,
      metadata: body.metadata,
      config: body.config,
    };

    const createdAssistant = await assistantManager.createAssistant(assistant);
    return c.json(createdAssistant, 201);
  };
};

export const getGraphAssistant = (
  graph: GraphServerConfiguration,
): AppRouteHandler<GetAssistantRoute> => {
  return async (c) => {
    const assistantManager = GRAPH_REGISTRY.getGraphAssistantManager(
      graph.graph_name,
    );
    const { assistant_id } = c.req.param();
    const assistant = await assistantManager.get(assistant_id);

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
