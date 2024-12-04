import { z } from "zod";

const EnvironmentSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default(
    "development",
  ),
  PORT: z.coerce.number().default(8080),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error", "fatal", "trace"])
    .default(
      "info",
    ),
});

const env = EnvironmentSchema.parse(process.env);
export default env;
