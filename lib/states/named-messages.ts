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

import { type BaseMessage, SystemMessage } from "@langchain/core/messages";
import { Annotation, messagesStateReducer } from "@langchain/langgraph";

/**
 * Messages annotation that mounts at a different key that 'messages'
 *
 * @param key
 * @returns
 */
export const NamedMessageAnnotation = (key: string) => {
    return Annotation.Root({
        [key]: Annotation<BaseMessage[]>({
            reducer: messagesStateReducer,
            default: () => [],
        }),
    });
};
