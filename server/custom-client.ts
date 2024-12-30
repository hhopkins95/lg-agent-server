// Custom client -- uses app type to assert streaming endpoint return types using EventSource

import { type Hono } from "hono";
import { hc } from "hono/client";
import type createGraphHonoServer from "./create-graph-server.ts";
import type { GraphServerConfiguration } from "./types";
import type { TStreamYield } from "../core/types";

export const getClient = <Spec extends GraphServerConfiguration>(
    url: string,
) => {
    type HonoAppType = ReturnType<typeof createGraphHonoServer<Spec>>;
    const hono_rc = hc<HonoAppType>(url);

    // functions
    const runStateless = hono_rc["stateless-runs"].run.$get;

    const streamStateless = async function* (
        input: Parameters<
            typeof hono_rc["stateless-runs"]["stream"]["$get"]
        >[0],
    ): AsyncGenerator<TStreamYield<Spec>> {
        const route_url = hono_rc["stateless-runs"].stream.$url();

        const params = new URLSearchParams({
            // @ts-expect-error
            ...input?.json,
        }).toString();

        const eventSource = new EventSource(`${route_url}?${params}`);

        try {
            while (true) {
                const message = await new Promise<TStreamYield<Spec>>(
                    (resolve, reject) => {
                        eventSource.onmessage = (event) => {
                            resolve(JSON.parse(event.data));
                        };
                        eventSource.onerror = (error) => {
                            reject(error);
                        };
                    },
                );
                yield message;
            }
        } finally {
            eventSource.close();
        }
    };

    return {
        runStateless,
        streamStateless,
    };
};
