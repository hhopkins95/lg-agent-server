import { HTTP_STATUS_CODES } from "../lib/hono/constants/index.ts";
import { createRouter } from "../lib/hono/create-base-app.ts";
import { jsonContent } from "../lib/hono/openapi/helpers/index.ts";
import { createMessageObjectSchema } from "../lib/hono/openapi/schemas/index.ts";
import type { AppRouterDef } from "../lib/hono/types.ts";

// Reference Route
const router = createRouter()
    .openapi({
        tags: ["Stateless Runs"], // Group within the OpenAPI doc
        method: "get",
        path: "/runs/stream",
        responses: {
            // This is the same as above but using the stoker helpers
            [HTTP_STATUS_CODES.OK]: jsonContent(
                createMessageObjectSchema("Hello from the index route"),
                "Definition of this route...",
            ),
        },
    }, (c) => {
        return c.json({
            message: "Hello from the index route",
        });
    })
    .openapi({
        tags: ["Stateless Runs"], // Group within the OpenAPI doc
        method: "get",
        path: "/runs/wait",
        responses: {
            // This is the same as above but using the stoker helpers
            [HTTP_STATUS_CODES.OK]: jsonContent(
                createMessageObjectSchema("Hello from the index route"),
                "Definition of this route...",
            ),
        },
    }, (c) => {
        return c.json({
            message: "Hello from the index route",
        });
    });

export const indexRouter: AppRouterDef = { router, rootPath: "/" };
