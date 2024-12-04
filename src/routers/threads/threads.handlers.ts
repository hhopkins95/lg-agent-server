import { AppRouteHandler } from "@/lib/hono/types.ts";
import { HTTPException } from "hono/http-exception";
import { GRAPH_REGISTRY } from "../../models/registry.ts";
import { GraphServerConfiguration } from "../../types.ts";
import type {
  CreateBackgroundRunRoute,
  CreateRunAndWaitRoute,
  CreateStreamRunRoute,
  CreateThreadRoute,
  GetThreadRoute,
  GetThreadStateRoute,
  ListMemoryRunsRoute,
  ListThreadsRoute,
} from "./threads.routes.ts";

export const createThread = (
  graph: GraphServerConfiguration,
): AppRouteHandler<CreateThreadRoute> => {
  return async (c) => {
    const threadManager = GRAPH_REGISTRY.getGraphThreadManager(
      graph.graph_name,
    );
    const body = await c.req.json();

    // Generate a unique ID for the thread
    const threadId = `thread_${crypto.randomUUID()}`;

    const thread = {
      id: threadId,
      graphName: graph.graph_name,
      metadata: {
        ...body.metadata,
        assistantId: body.assistantId,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      curState: {
        checkpoint: {
          thread_id: threadId,
          checkpoint_ns: "initial",
        },
        metadata: {},
        created_at: new Date(),
        next: [],
        values: graph.state_schema.parse({}),
      },
    };

    const createdThread = await threadManager.create(thread);
    return c.json(createdThread, 201);
  };
};

export const getThread = (
  graph: GraphServerConfiguration,
): AppRouteHandler<GetThreadRoute> => {
  return async (c) => {
    const threadManager = GRAPH_REGISTRY.getGraphThreadManager(
      graph.graph_name,
    );
    const { threadId } = c.req.param();
    const thread = await threadManager.get(threadId);

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
  graph: GraphServerConfiguration,
): AppRouteHandler<ListThreadsRoute> => {
  return async (c) => {
    const threadManager = GRAPH_REGISTRY.getGraphThreadManager(
      graph.graph_name,
    );
    const { assistantId } = c.req.query();
    const threads = await threadManager.listByAssistant(assistantId);
    return c.json(threads, 200);
  };
};

export const getThreadState = (
  graph: GraphServerConfiguration,
): AppRouteHandler<GetThreadStateRoute> => {
  return async (c) => {
    const threadManager = GRAPH_REGISTRY.getGraphThreadManager(
      graph.graph_name,
    );
    const { threadId } = c.req.param();
    const { checkpointId } = c.req.query();

    const state = await threadManager.getState(threadId, checkpointId);
    if (!state) {
      throw new HTTPException(404, {
        message: "Thread or checkpoint not found",
      });
    }

    return c.json(state, 200);
  };
};

export const createRunAndWaitHandler = (
  graph: GraphServerConfiguration,
): AppRouteHandler<CreateRunAndWaitRoute> => {
  return async (c) => {
    const threadManager = GRAPH_REGISTRY.getGraphThreadManager(
      graph.graph_name,
    );
    const assistantManager = GRAPH_REGISTRY.getGraphAssistantManager(
      graph.graph_name,
    );
    const runManager = GRAPH_REGISTRY.getGraphRunManager(graph.graph_name);

    const { thread_id } = c.req.param();
    const body = await c.req.json();

    const thread = await threadManager.get(thread_id);
    if (!thread) {
      throw new HTTPException(404, { message: "Thread not found" });
    }

    const assistant = await assistantManager.get(thread.metadata.assistantId);
    if (!assistant) {
      throw new HTTPException(404, { message: "Assistant not found" });
    }

    const runId = `run_${crypto.randomUUID()}`;
    const run = await runManager.create({
      id: runId,
      threadId,
      graphName: graph.name,
      status: "queued",
      metadata: body.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // TODO: Implement run execution logic
    return c.json(run, 201);
  };
};

export const createStreamRunHandler = (
  graph: GraphServerConfiguration,
): AppRouteHandler<CreateStreamRunRoute> => {
  return async (c) => {
    const threadManager = GRAPH_REGISTRY.getGraphThreadManager(
      graph.graph_name,
    );
    const assistantManager = GRAPH_REGISTRY.getGraphAssistantManager(
      graph.graph_name,
    );
    const runManager = GRAPH_REGISTRY.getGraphRunManager(graph.graph_name);

    const { thread_id } = c.req.param();
    const body = await c.req.json();

    const thread = await threadManager.get(thread_id);
    if (!thread) {
      throw new HTTPException(404, { message: "Thread not found" });
    }

    const assistant = await assistantManager.get(thread.metadata.assistantId);
    if (!assistant) {
      throw new HTTPException(404, { message: "Assistant not found" });
    }

    const runId = `run_${crypto.randomUUID()}`;
    const run = await runManager.create({
      id: runId,
      threadId,
      graphName: graph.name,
      status: "queued",
      metadata: body.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // TODO: Implement streaming run execution logic
    return c.json(run, 201);
  };
};

export const createBackgroundRunHandler = (
  graph: GraphServerConfiguration,
): AppRouteHandler<CreateBackgroundRunRoute> => {
  return async (c) => {
    const threadManager = GRAPH_REGISTRY.getGraphThreadManager(
      graph.graph_name,
    );
    const assistantManager = GRAPH_REGISTRY.getGraphAssistantManager(
      graph.graph_name,
    );
    const runManager = GRAPH_REGISTRY.getGraphRunManager(graph.graph_name);

    const { thread_id } = c.req.param();
    const body = await c.req.json();

    const thread = await threadManager.get(thread_id);
    if (!thread) {
      throw new HTTPException(404, { message: "Thread not found" });
    }

    const assistant = await assistantManager.get(thread.metadata.assistantId);
    if (!assistant) {
      throw new HTTPException(404, { message: "Assistant not found" });
    }

    const runId = `run_${crypto.randomUUID()}`;
    const run = await runManager.create({
      id: runId,
      threadId,
      graphName: graph.name,
      status: "queued",
      metadata: body.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // TODO: Implement background run execution logic
    return c.json(run, 201);
  };
};

export const listRunsHandler = (
  graph: GraphServerConfiguration,
): AppRouteHandler<ListMemoryRunsRoute> => {
  return async (c) => {
    const threadManager = GRAPH_REGISTRY.getGraphThreadManager(graph.name);
    const runManager = GRAPH_REGISTRY.getGraphRunManager(graph.name);

    const { threadId } = c.req.param();
    const thread = await threadManager.get(threadId);
    if (!thread) {
      throw new HTTPException(404, { message: "Thread not found" });
    }

    const runs = await runManager.listByThread(threadId);
    return c.json(runs, 200);
  };
};
