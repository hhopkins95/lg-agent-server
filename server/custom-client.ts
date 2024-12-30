// Custom client -- uses app type to assert streaming endpoint return types using EventSource

import { type Hono } from "hono";
import { type ClientResponse, hc } from "hono/client";
import type createGraphHonoServer from "./create-graph-server.ts";
import type { GraphServerConfiguration } from "./types";
import type { TStreamYield } from "../core/types";
import type { statelessRunsRouter } from "./routers/stateless-runs.router.ts";

type ExtractResponseType<T> = T extends Promise<ClientResponse<infer R>> ? R
    : never;

const withJsonResponse = <
    T extends (...args: any[]) => Promise<ClientResponse<any>>,
>(
    routeFn: T,
) => {
    return async (
        ...args: Parameters<T>
    ): Promise<ExtractResponseType<ReturnType<T>>> => {
        const response = await routeFn(...args);
        return response.json() as ExtractResponseType<ReturnType<T>>;
    };
};

export const getClient = <Spec extends GraphServerConfiguration>(
    url: string,
) => {
    type HonoAppType = ReturnType<typeof createGraphHonoServer<Spec>>;
    const hono_rc = hc<HonoAppType>(url);

    // Stateless runs router
    const runStateless = withJsonResponse(hono_rc["stateless-runs"].run.$post);

    const streamStateless = async function* (
        input: Parameters<
            typeof hono_rc["stateless-runs"]["stream"]["$post"]
        >[0],
    ): AsyncGenerator<TStreamYield<Spec>> {
        // @ts-expect-error
        const response = await hono_rc["stateless-runs"].stream.$post(input);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error("No readable stream available");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || ""; // Keep the last partial line in the buffer

                for (const line of lines) {
                    if (line.trim()) {
                        yield JSON.parse(line);
                    }
                }
            }

            // Handle any remaining data
            if (buffer.trim()) {
                yield JSON.parse(buffer);
            }
        } finally {
            reader.releaseLock();
        }
    };

    return {
        runStateless,
        streamStateless,
    };
};
