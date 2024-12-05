import { AppOpenApi } from "./types.ts";
import { apiReference } from "@scalar/hono-api-reference";

// Adds the OpenAPI Documentation to the app
export function configureAppOpenApi(
  app: AppOpenApi,
  { title, version }: { title: string; version: string },
) {
  app.doc("/doc", {
    openapi: "3.0.3",
    info: {
      title,
      version,
    },
  });

  app.get(
    "/reference",
    apiReference({
      spec: {
        "url": "/doc",
      },
      theme: "kepler",
      defaultHttpClient: {
        targetKey: "javascript",
        clientKey: "fetch",
      },
    }),
  );
}
