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

import type { BaseMessage } from "@langchain/core/messages";
import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import { z } from "zod";

/**
 * Pre-built schema for message input -- seperate the input / messages state, since the input needs to be validated by zod in the server. Also allows for more flexible processing / management of messages in the state
 */

/**
 * Schema for validating message input in the server.
 * Defines the structure of messages that can be processed by the system.
 */
export const MessageInputSchema = z.object({
    content: z.string(),
});

/**
 * Type definition inferred from MessageInputSchema.
 * Represents the structure of a validated message input.
 */
export type MessageInput = z.infer<typeof MessageInputSchema>;

/**
 * Annotation for handling message input state.
 * Creates a state container for validated message input that can be used in the graph.
 */
export const MessageInputAnnotation = Annotation<MessageInput>();
/**
 * Creates a messages annotation with a custom state reducer.
 * Allows for flexible message state management with a custom message array initialization.
 * Unlike the default MessagesAnnotation, this starts with an empty array and can be mounted at any key.
 *
 * @param key - The key at which to mount the messages state
 * @returns An Annotation instance for managing message state
 */
export const CustomMessagesAnnotation = Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
});
