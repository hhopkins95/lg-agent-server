/**
 * MessagesAnnotation is a pre-built state annotation imported from @langchain/langgraph.
 * It is the same as the following annotation:
 *
 * ```typescript
 * const MessagesAnnotation = Annotation.Root({
 *   messages: Annotation<BaseMessage[]>({
 *     reducer: messagesStateReducer,
 *     default: () => [systemMessage],
 *   }),
 * });
 * ```
 */

import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import { z } from "zod";

export const MessageSchema = z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string(),
});

export type Message = z.infer<typeof MessageSchema>;

/**
 * Messages annotation that allows messages to be mounted at a different key that 'messages'
 *
 * @param key
 * @returns
 */
export const CustomMessagesAnnotation = Annotation<Message[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
});
