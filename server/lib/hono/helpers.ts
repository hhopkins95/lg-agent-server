import { Hono } from "hono";
import { hc } from "hono/client";
import type { Env, MergePath, MergeSchemaPath, Schema } from "hono/types";

export interface Module {
    path: string;
    routes: Hono;
}

const base = new Hono();

const installedModules = [
    {
        path: "/auth",
        routes: new Hono().get("/", (c) => c.text("Hello auth")),
    },
    {
        path: "/profile",
        routes: new Hono().get("/", (c) => c.text("Bye profile")),
    },
] as const satisfies Module[];

// merge
export function mergeRoutes<T extends Module[], H extends Hono>(
    base: H,
    ...routes: T
) {
    for (const route of routes) {
        base.route(route.path, route.routes);
    }
    return base as unknown as H extends Hono<infer E, infer S, infer B>
        ? MergeRoutes<T, E, S, B>
        : never;
}

type MergeUnion<T> = (T extends any ? (x: T) => void : never) extends
    ((x: infer R) => void) ? R : never;

type MergeSchema<T extends any[], B extends string> = MergeUnion<
    T[number] extends infer module
        ? module extends { path: infer N; routes: infer H }
            ? H extends Hono<infer _, infer S>
                ? MergeSchemaPath<S, MergePath<B, N extends string ? N : never>>
            : never
        : never
        : never
>;

type MergeRoutes<
    T extends any[],
    E extends Env,
    S extends Schema,
    B extends string,
> = Hono<E, MergeSchema<T, B> & S, B>;

const routes = mergeRoutes(
    base.get("/", (c) => c.text("Hello World")),
    ...installedModules,
);

type AppType = typeof routes;

const client = hc<AppType>("/");

const authResp = client.auth.$get();
