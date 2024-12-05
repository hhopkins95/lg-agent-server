import type { Hook } from "@hono/zod-openapi";

import { UNPROCESSABLE_ENTITY } from "../constants/http-status-codes.ts";

/**
 * Default hook for handling validation errors.
 * @param result - The validation result.
 * @param c - The context object.
 * @returns The response object.
 */
const defaultHook: Hook<any, any, any, any> = (result, c) => {
  if (!result.success) {
    return c.json(
      {
        success: result.success,
        error: result.error,
      },
      UNPROCESSABLE_ENTITY,
    );
  }
};

export default defaultHook;
