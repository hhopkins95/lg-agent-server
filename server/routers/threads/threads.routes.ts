import type { GraphServerConfiguration } from "@/server/types.ts";
import { ErrorResponseSchema } from "../../lib/hono/constants/errors.ts";
import { HTTP_STATUS_CODES } from "../../lib/hono/constants/index.ts";
import jsonContent from "../../lib/hono/openapi/helpers/json-content.ts";
import { createRoute, z } from "@hono/zod-openapi";
/**
 * Create a new thread
 */
export const createThread = (graph: GraphServerConfiguration) =>
  createRoute({
    path: "/threads",
    method: "post",
    tags: [graph.graph_name],
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              assistantId: z.string(),
              metadata: z.record(z.unknown()).optional(),
            }),
          },
        },
        required: true,
      },
    },
    responses: {
      [HTTP_STATUS_CODES.CREATED]: jsonContent(
        ThreadSchema(graph.state_schema),
        "Created thread",
      ),
      [HTTP_STATUS_CODES.BAD_REQUEST]: jsonContent(
        ErrorResponseSchema,
        "Invalid request body",
      ),
      [HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR]: jsonContent(
        ErrorResponseSchema,
        "Internal server error",
      ),
    },
  });

export type CreateThreadRoute = ReturnType<typeof createThread>;

/**
 * Get a thread by ID
 */
export const getThread = (graph: GraphServerConfiguration) =>
  createRoute({
    path: "/threads/{threadId}",
    method: "get",
    tags: [graph.graph_name],
    request: {
      params: z.object({
        threadId: z.string(),
      }),
    },
    responses: {
      [HTTP_STATUS_CODES.OK]: jsonContent(
        ThreadSchema(graph.state_schema),
        "Thread found",
      ),
      [HTTP_STATUS_CODES.NOT_FOUND]: jsonContent(
        ErrorResponseSchema,
        "Thread not found",
      ),
      [HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR]: jsonContent(
        ErrorResponseSchema,
        "Internal server error",
      ),
    },
  });

export type GetThreadRoute = ReturnType<typeof getThread>;

/**
 * List threads by assistant
 */
export const listThreadsByAssistant = (graph: GraphServerConfiguration) =>
  createRoute({
    path: "/threads",
    method: "get",
    tags: [graph.graph_name],
    request: {
      query: z.object({
        assistantId: z.string(),
      }),
    },
    responses: {
      [HTTP_STATUS_CODES.OK]: jsonContent(
        z.array(ThreadSchema(graph.state_schema)),
        "List of threads for the assistant",
      ),
      [HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR]: jsonContent(
        ErrorResponseSchema,
        "Internal server error",
      ),
    },
  });

export type ListThreadsRoute = ReturnType<typeof listThreadsByAssistant>;

/**
 * Get thread state from checkpoint
 */
export const getThreadState = (graph: GraphServerConfiguration) =>
  createRoute({
    path: "/threads/{threadId}/state",
    method: "get",
    tags: [graph.graph_name],
    request: {
      params: z.object({
        threadId: z.string(),
      }),
      query: z.object({
        checkpointId: z.string().optional(),
      }),
    },
    responses: {
      [HTTP_STATUS_CODES.OK]: jsonContent(
        ThreadStateSchema(graph.state_schema),
        "Thread state",
      ),
      [HTTP_STATUS_CODES.NOT_FOUND]: jsonContent(
        ErrorResponseSchema,
        "Thread or checkpoint not found",
      ),
      [HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR]: jsonContent(
        ErrorResponseSchema,
        "Internal server error",
      ),
    },
  });

export type GetThreadStateRoute = ReturnType<typeof getThreadState>;

/**
 * Create a run on this thread and wait for it's output
 */
export const createRunAndWait = (graph: GraphServerConfiguration) =>
  createRoute({
    path: "/threads/{thread_id}/runs/wait",
    method: "post",
    tags: [graph.graph_name],
    request: {
      params: z.object({
        thread_id: z.string(),
      }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              assistant_id: z.string(),
              metadata: z.record(z.unknown()).optional(),
            }),
          },
        },
        required: true,
      },
    },
    responses: {
      [HTTP_STATUS_CODES.OK]: jsonContent(
        RunSchema(graph),
        "Completed memory-based synchronous run",
      ),
      [HTTP_STATUS_CODES.NOT_FOUND]: jsonContent(
        ErrorResponseSchema,
        "Thread or assistant not found",
      ),
      [HTTP_STATUS_CODES.BAD_REQUEST]: jsonContent(
        ErrorResponseSchema,
        "Invalid request body",
      ),
    },
  });

export type CreateRunAndWaitRoute = ReturnType<typeof createRunAndWait>;

/**
 * Create a run on this thread and stream the output
 */
export const createStreamRun = (graph: GraphServerConfiguration) =>
  createRoute({
    path: "/threads/{thread_id}/runs/stream",
    method: "post",
    tags: [graph.graph_name],
    request: {
      params: z.object({
        thread_id: z.string(),
      }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              assistant_id: z.string(),
              metadata: z.record(z.unknown()).optional(),
            }),
          },
        },
        required: true,
      },
    },
    responses: {
      [HTTP_STATUS_CODES.CREATED]: jsonContent(
        RunSchema(graph),
        "Created memory-based streaming run",
      ),
      [HTTP_STATUS_CODES.NOT_FOUND]: jsonContent(
        ErrorResponseSchema,
        "Thread or assistant not found",
      ),
      [HTTP_STATUS_CODES.BAD_REQUEST]: jsonContent(
        ErrorResponseSchema,
        "Invalid request body",
      ),
    },
  });

export type CreateStreamRunRoute = ReturnType<
  typeof createStreamRun
>;

/**
 * Create a background run on this thread
 */
export const createBackgroundRun = (graph: GraphServerConfiguration) =>
  createRoute({
    path: "/threads/{thread_id}/memory-runs/background",
    method: "post",
    tags: [graph.graph_name],
    request: {
      params: z.object({
        thread_id: z.string(),
      }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              assistant_id: z.string(),
              metadata: z.record(z.unknown()).optional(),
            }),
          },
        },
        required: true,
      },
    },
    responses: {
      [HTTP_STATUS_CODES.ACCEPTED]: jsonContent(
        RunSchema(graph),
        "Created memory-based background run",
      ),
      [HTTP_STATUS_CODES.NOT_FOUND]: jsonContent(
        ErrorResponseSchema,
        "Thread or assistant not found",
      ),
      [HTTP_STATUS_CODES.BAD_REQUEST]: jsonContent(
        ErrorResponseSchema,
        "Invalid request body",
      ),
    },
  });

export type CreateBackgroundRunRoute = ReturnType<
  typeof createBackgroundRun
>;

/**
 * List runs for a thread
 */
export const listRuns = (graph: GraphServerConfiguration) =>
  createRoute({
    path: "/threads/{thread_id}/memory-runs",
    method: "get",
    tags: [graph.graph_name],
    request: {
      params: z.object({
        thread_id: z.string(),
      }),
    },
    responses: {
      [HTTP_STATUS_CODES.OK]: jsonContent(
        z.array(RunSchema(graph)),
        "List of memory-based runs for the thread",
      ),
      [HTTP_STATUS_CODES.NOT_FOUND]: jsonContent(
        ErrorResponseSchema,
        "Thread not found",
      ),
    },
  });

export type ListMemoryRunsRoute = ReturnType<typeof listRuns>;
