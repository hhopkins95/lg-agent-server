// Minimal

import { zValidator } from "@hono/zod-validator";
import { Annotation } from "@langchain/langgraph";
import { Hono } from "hono";
import { hc } from "hono/client";
import { z } from "zod";

type TAnnotation = ReturnType<typeof Annotation.Root<any>>;
type TTestGraphSpec<
    Res extends TAnnotation = TAnnotation,
    Input extends z.ZodSchema = z.ZodSchema,
    Config extends z.ZodSchema = z.ZodSchema,
> = {
    config_schema: Config;
    input_schema: Input;
    return_type: Res;
};
const simulateApiCall = async <ResType>() => {
    const response = await fetch("http://localhost:8080/test", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ abc: 2 }),
    });
    const data = await response.json() as ResType;
    return data;
};

const someAnnotation = Annotation.Root({
    abc: Annotation<number>(),
});
const someSchema = z.object({
    abc: z.number(),
});

const Spec: TTestGraphSpec = {
    config_schema: someSchema,
    input_schema: someSchema,
    return_type: someAnnotation,
};

const getExampleRouter = <
    TSpec extends TTestGraphSpec,
>(
    spec: TSpec,
) => {
    return new Hono().post(
        "/test",
        zValidator(
            "json",
            spec.input_schema,
        ),
        async (c) => {
            const response = await simulateApiCall<TSpec["return_type"]>();
            return c.json({ response }); // as TRes;
        },
    );
};

const createApp = (spec: TTestGraphSpec) =>
    new Hono().route(
        "/test",
        getExampleRouter(spec),
    );
const app = createApp(Spec);
type AppType = typeof app;
const client = hc<AppType>("/");

const res = await client.test.test.$post({
    json: {},
});

const val = await res.json();
