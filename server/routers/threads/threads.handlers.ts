import { type AppRouteHandler } from "../../lib/hono/types.ts";
import { HTTPException } from "hono/http-exception";
import { GRAPH_REGISTRY } from "../../registry.ts";
import type { TGraphDef } from "../../../core/types.ts";
import type {
  CreateRunAndWaitRoute,
  CreateStreamRunRoute,
  CreateThreadRoute,
  GetThreadRoute,
  ListThreadsRoute,
} from "./threads.routes.ts";

export const createThread = (
  graph: TGraphDef,
): AppRouteHandler<CreateThreadRoute> => {
  return async (c) => {
    const manager = GRAPH_REGISTRY.getManager(graph.name);
    const body = await c.req.json();

    const createdThread = await manager.createThread(body.assistant_id);
    return c.json(createdThread, 201);
  };
};

export const getThread = (
  graph: TGraphDef,
): AppRouteHandler<GetThreadRoute> => {
  return async (c) => {
    const manager = GRAPH_REGISTRY.getManager(graph.name);
    const { thread_id } = c.req.param();
    const thread = await manager.getThread(thread_id);

    if (!thread) {
      return c.json({
        error: {
          message: "Thread not found",
          code: "not_found",
        },
      }, 404);
    }

    return c.json(thread, 200);
  };
};

export const listThreadsByAssistant = (
  graph: TGraphDef,
): AppRouteHandler<ListThreadsRoute> => {
  return async (c) => {
    const manager = GRAPH_REGISTRY.getManager(graph.name);
    const { assistant_id } = c.req.query();
    const threads = await manager.listThreads({
      assistant_id: assistant_id,
    });
    return c.json(threads, 200);
  };
};

export const createRunAndWaitHandler = (
  graph: TGraphDef,
): AppRouteHandler<CreateRunAndWaitRoute> => {
  return async (c) => {
    const manager = GRAPH_REGISTRY.getManager(graph.name);
    const { thread_id } = c.req.param();
    const body = await c.req.json();

    const thread = await manager.getThread(thread_id);
    if (!thread) {
      throw new HTTPException(404, { message: "Thread not found" });
    }

    const result = await manager.invokeGraph({
      thread_id,
      config: body.config,
    });

    if (!result.success) {
      throw new HTTPException(500, { message: result.error });
    }

    return c.json({
      status: "completed",
      values: result.values,
    }, 200);
  };
};

export const createStreamRunHandler = (
  graph: TGraphDef,
): AppRouteHandler<CreateStreamRunRoute> => {
  return async (c) => {
    const manager = GRAPH_REGISTRY.getManager(graph.name);
    const { thread_id } = c.req.param();
    const body = await c.req.json();

    const thread = await manager.getThread(thread_id);
    if (!thread) {
      throw new HTTPException(404, { message: "Thread not found" });
    }

    // Set up SSE
    c.header("Content-Type", "text/event-stream");
    c.header("Cache-Control", "no-cache");
    c.header("Connection", "keep-alive");

    const stream = manager.streamGraph({
      thread_id,
      config: body.config,
    });

    const encoder = new TextEncoder();
    const writer = c.res.();

    try {
      for await (const chunk of stream) {
        const data = JSON.stringify(chunk);
        await writer.write(encoder.encode(`data: ${data}\n\n`));
      }
    } catch (error) {
      const errorData = JSON.stringify({ error: error.message });
      await writer.write(encoder.encode(`data: ${errorData}\n\n`));
    } finally {
      writer.close();
    }

    return c.body(null);
  };
};
