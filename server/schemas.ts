import { z } from "zod";
import type {
    TAnnotation,
    TAssistant,
    TInterrupt,
    TThread,
    TThreadStatus,
} from "@/core/types";

// Thread Status Schema
const ThreadStatusSchema: z.ZodType<TThreadStatus> = z.discriminatedUnion(
    "status",
    [
        z.object({
            status: z.literal("idle"),
        }),
        z.object({
            status: z.literal("running"),
        }),
        z.object({
            status: z.literal("interrupted"),
            pending_interrupt: z.custom<TInterrupt>(),
        }).strict(),
        z.object({
            status: z.literal("error"),
            error: z.string(),
        }),
    ],
);

/**
 * Create a Thread schema with a specific state schema
 * @param stateSchema - Schema for the thread's state values
 */
export const ThreadSchema = <TState extends TAnnotation>(
    stateSchema: z.ZodType<TState["State"]>,
): z.ZodType<TThread<TState>> =>
    z.object({
        id: z.string(),
        assistant_id: z.string().optional(),
        created_at: z.string(),
        updated_at: z.string(),
        status: ThreadStatusSchema,
        values: stateSchema.optional(),
    });

/**
 * Create an Assistant schema with a specific config schema
 * @param configSchema - Schema for the assistant's config
 */
export const AssistantSchema = <TConfig extends z.ZodType>(
    configSchema: TConfig,
) => z.object({
    id: z.string(),
    graph_name: z.string(),
    description: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
    config: configSchema,
});
