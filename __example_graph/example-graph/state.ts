import {
    CustomMessagesAnnotation,
    MessageInputAnnotation,
    MessageInputSchema,
} from "@agent-toolkit/lib/states";
import { Annotation } from "@langchain/langgraph";
import { assert, type Equals } from "tsafe";
import { z } from "zod";

// Input
export const InputAnnotation = Annotation.Root({
    message_input: MessageInputAnnotation,
});

export const InputSchema = z.object({
    message_input: MessageInputSchema,
});

assert<Equals<z.infer<typeof InputSchema>, typeof InputAnnotation.State>>;

// Output
export const OutputAnnotation = Annotation.Root({
    messages: CustomMessagesAnnotation,
    count: Annotation<number>, // example number property -- counts how many times the model has been called
});

// Total State
export const TotalStateAnnotation = Annotation.Root({
    ...InputAnnotation.spec,
    ...OutputAnnotation.spec,
});

// Stream Keys -- keys to help the client pick up on what to add to it's state
export const streamStateKeys: Array<keyof typeof OutputAnnotation.State> = [
    "messages",
];
