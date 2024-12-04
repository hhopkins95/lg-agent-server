import { createRoute, z } from "@hono/zod-openapi";
import { HTTP_STATUS_CODES } from "@/lib/hono/constants/index.ts";
import jsonContent from "@/lib/hono/openapi/helpers/json-content.ts";
import {
  AssistantSchema,
  GraphServerConfiguration,
  GraphServerProp,
} from "../../types.ts";
import { ErrorResponseSchema } from "@/lib/hono/constants/errors.ts";

/**
 * List all assistants for a specific graph
 */
export const listAllGraphAssistants = (agent: GraphServerConfiguration) => {
  const route = createRoute({
    path: "/assistants",
    method: "get",
    tags: [agent.graph_name],
    responses: {
      [HTTP_STATUS_CODES.OK]: jsonContent(
        z.array(AssistantSchema(agent)),
        "All assistants for this graph",
      ),
      [HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR]: jsonContent(
        ErrorResponseSchema,
        "Internal server error",
      ),
    },
  });

  return route;
};

export type ListAssistantsRoute = ReturnType<typeof listAllGraphAssistants>;

/**
 * Create a new assistant for a specific graph
 */
export const createGraphAssistant = (agent: GraphServerConfiguration) => {
  const route = createRoute({
    path: "/assistants",
    method: "post",
    tags: [agent.graph_name],
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              name: z.string().optional(),
              metadata: z.record(z.unknown()).optional(),
              description: z.string().optional(),
            }),
          },
        },
        required: true,
      },
    },
    responses: {
      [HTTP_STATUS_CODES.CREATED]: jsonContent(
        AssistantSchema(agent),
        "The created assistant",
      ),
      [HTTP_STATUS_CODES.BAD_REQUEST]: jsonContent(
        ErrorResponseSchema,
        "Invalid request",
      ),
      [HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR]: jsonContent(
        ErrorResponseSchema,
        "Internal server error",
      ),
    },
  });

  return route;
};

export type CreateAssistantRoute = ReturnType<typeof createGraphAssistant>;

/**
 * Get a specific assistant
 */
export const getGraphAssistant = (agent: GraphServerConfiguration) => {
  const route = createRoute({
    path: "/assistants/{assistant_id}",
    method: "get",
    tags: [agent.graph_name],
    request: {
      params: z.object({
        assistant_id: z.string(),
      }),
    },
    responses: {
      [HTTP_STATUS_CODES.OK]: jsonContent(
        AssistantSchema(agent),
        "The requested assistant",
      ),
      [HTTP_STATUS_CODES.NOT_FOUND]: jsonContent(
        ErrorResponseSchema,
        "Assistant not found",
      ),
      [HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR]: jsonContent(
        ErrorResponseSchema,
        "Internal server error",
      ),
    },
  });

  return route;
};

export type GetAssistantRoute = ReturnType<typeof getGraphAssistant>;
