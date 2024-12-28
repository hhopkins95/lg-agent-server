import {
    assertTypesAreEqual,
    getLLM,
    type StrictValidateStateTypes,
} from "@/lib";
import type { BaseLanguageModelInput } from "@langchain/core/language_models/base";
import type { BaseChatModelCallOptions } from "@langchain/core/language_models/chat_models";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { Annotation, MessagesAnnotation } from "@langchain/langgraph";
import { z } from "zod";

// const testAnnotation = Annotation.Root({
//     ...MessagesAnnotation.spec,
// });

// const testMessagesSchema = z.object({
//     messages: z.array(z.object({
//         _getType: z.string(),
//         content: z.string(),
//     })),
// });

// const bar = new HumanMessage("");

// type MessagesType = typeof testAnnotation.State["messages"][number];

// type foo = StrictValidateStateTypes<
//     typeof testAnnotation,
//     typeof testMessagesSchema
// >;

const llm = getLLM("qwen2_5__05b");

const res = await llm.invoke([{
    role: "system",
    content: "asdf",
}, new HumanMessage("asdf")], {
    tags: ["messages"],
});

console.log(res);
