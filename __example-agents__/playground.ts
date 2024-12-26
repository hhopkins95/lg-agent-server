import {getLLM} from "@/lib/models/loadLLM"
import { tool } from "@langchain/core/tools"
import {z} from "zod"
import { Prompt2, TEST_SYSTEM_PROMPT } from "./test-prompt";
import { SystemMessage } from "@langchain/core/messages";

const processRefundTool = tool(
  (input) => {
    return `Hello lil guy`;
  },
  {
    name: "Say Hello Tool",
    description: "Say Hello to the User",
  },
);
const llm = getLLM("qwen2_5__05b") // .bindTools([processRefundTool])

const result = await llm.invoke([
    new SystemMessage(Prompt2),

  {
    role: "user",
    content: "Please read the file at this path `Users/hunterhopkins/dev/test.ts` and tell me what's inside.",
  },
])


console.log(result)