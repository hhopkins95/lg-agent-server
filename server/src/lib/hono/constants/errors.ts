import { z } from "zod";
export const ZOD_ERROR_MESSAGES = {
  REQUIRED: "Required",
  EXPECTED_NUMBER: "Expected number, received nan",
  NO_UPDATES: "No updates provided",
};

export const ZOD_ERROR_CODES = {
  INVALID_UPDATES: "invalid_updates",
};

// Error response schemas
export const ErrorResponseSchema = z.object({
  error: z.object({
    message: z.string(),
    code: z.string(),
  }),
});

// export type AssistantResponse = z.infer<typeof AssistantResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
