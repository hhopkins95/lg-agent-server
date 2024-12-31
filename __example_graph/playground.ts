/**
 * For random tests / quick debugging
 */

import { getLLM } from "@agent-toolkit/lib/models";
import { HumanMessage } from "@langchain/core/messages";

const llm = getLLM("qwen2_5__05b");

const res = await llm.invoke([{
    role: "system",
    content: "asdf",
}, new HumanMessage("Write a fibonacci sequence in python")], {
    tags: ["messages"],
});

console.log(res);
