// Custom client -- uses app type to assert streaming endpoint return types using EventSource

import { type Hono } from "hono";
import { hc } from "hono/client";
import type createGraphHonoServer from "./create-graph-server.ts";
import type { GraphServerConfiguration } from "./types";

export const getClient = <Spec extends GraphServerConfiguration>(
    url: string,
) => {
    type HonoAppType = ReturnType<typeof createGraphHonoServer<Spec>>;
    const hono_rc = hc<HonoAppType>(url);

    // functions
    const runStateless = hono_rc["stateless-runs"].run.$get;

    type StreamInput = Parameters<
        typeof hono_rc["stateless-runs"]["stream"]["$get"]
    >[0];

    const streamStateless = (input: StreamInput) => {
        const route_url = hono_rc["stateless-runs"].stream.$url();

        const params = new URLSearchParams({
            // @ts-expect-error
            ...input?.json,
        }).toString();

        // Use EventSource
        const eventSource = new EventSource(`${route_url}?${params}`);

        eventSource.onmessage = (event) => {
            console.log(event.data);
        };

        eventSource.onerror = (event) => {
            console.error("EventSource error:", event);
        };
    };

    return {
        runStateless,
        streamStateless,
    };
};
