import { createRouter } from "../../../server/lib/hono/create-base-app.ts";
import { type GraphRouterGenerator } from "../../../core/types_old.ts";
import * as handlers from "./threads.handlers.ts";
import * as routes from "./threads.routes.ts";

export const threadsRouter: GraphRouterGenerator = (graphSpec) => {
  const router = createRouter()
    .openapi(
      routes.createThread(graphSpec),
      handlers.createThread(graphSpec),
    )
    .openapi(
      routes.getThread(graphSpec),
      handlers.getThread(graphSpec),
    )
    .openapi(
      routes.listThreadsByAssistant(graphSpec),
      handlers.listThreadsByAssistant(graphSpec),
    )
    .openapi(
      routes.getThreadState(graphSpec),
      handlers.getThreadState(graphSpec),
    )
    .openapi(
      routes.createRunAndWait(graphSpec),
      handlers.createRunAndWaitHandler(
        graphSpec,
      ),
    )
    .openapi(
      routes.createStreamRun(graphSpec),
      handlers.createStreamRunHandler(
        graphSpec,
      ),
    )
    .openapi(
      routes.createBackgroundRun(graphSpec),
      handlers.createBackgroundRunHandler(
        graphSpec,
      ),
    )
    .openapi(
      routes.listRuns(graphSpec),
      handlers.listRunsHandler(graphSpec),
    );

  return {
    router,
    rootPath: "/threads",
  };
};
