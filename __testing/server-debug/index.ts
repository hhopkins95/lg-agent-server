// Minimal

import { zValidator } from "@hono/zod-validator";
import { Annotation } from "@langchain/langgraph";
import { Hono } from "hono";
import { hc } from "hono/client";
import { z } from "zod";

// Base types
type TAnnotation = ReturnType<typeof Annotation.Root<any>>;

type TTestGraphSpec<
    Res extends TAnnotation = TAnnotation,
    Input extends z.ZodSchema = z.ZodSchema,
    Config extends z.ZodSchema = z.ZodSchema,
> = {
    config_schema: Config;
    input_schema: Input;
    output_annotation: Res;
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
    schema: z.number(),
});

const Spec = {
    config_schema: someSchema,
    input_schema: someSchema,
    output_annotation: someAnnotation,
} as const satisfies TTestGraphSpec;

const getExampleRouter = <Input extends z.ZodSchema, Output>(
    inputSchema: Input,
    outputType: Output,
) => {
    return new Hono()
        .post(
            "/",
            zValidator("json", z.object({ input: inputSchema })),
            async (c) => {
                const response = await simulateApiCall<Output>();
                return c.json({ response });
            },
        );
};

const createApp = <Input extends z.ZodSchema, Output>(
    inputSchema: Input,
    outputType: Output,
    spec: TTestGraphSpec,
) => {
    const router = getExampleRouter<Input, Output>(inputSchema, outputType);
    return new Hono().route("/test", router);
};

const app = createApp(
    Spec.input_schema,
    Spec.output_annotation.State,
    Spec,
);
type AppType = typeof app;
const client = hc<AppType>("/");

// Now these should be properly typed
const res = await client.test.$post({
    json: { input: { schema: 123 } }, // Should have type completion for abc: number
});

const val = await res.json(); // Should be typed as { response: { abc: number } }

const createAppFromSpec = <
    T extends TTestGraphSpec,
    InSchema extends T["input_schema"] = T["input_schema"],
>(spec: T) => {
    const res = createApp<
        InSchema,
        T["output_annotation"]["State"]
    >(
        spec.input_schema as InSchema,
        spec.output_annotation.State,
        spec,
    );
    return res;
};

const app2 = createAppFromSpec(Spec);
type App2Type = typeof app2;
const client2 = hc<App2Type>("/");
const res2 = await client2.test.$post({
    json: {},
});
