import type { TAnnotation, TAssistant, TSavedThread } from "../types.ts";

/**
 * Filter type for querying threads
 */
export type ThreadFilter = {
    assistant_id?: string;
    status?: "idle" | "busy" | "interrupted" | "error";
    created_before?: string;
    created_after?: string;
};

/**
 * Application storage interface for managing assistants and threads
 */
export interface AppStorage<
    TConfig extends TAnnotation = TAnnotation,
    TState extends TAnnotation = TAnnotation,
> {
    // Assistant operations
    createAssistant(
        assistant: TAssistant<TConfig>,
    ): Promise<TAssistant<TConfig>>;
    getAssistant(id: string): Promise<TAssistant<TConfig> | undefined>;
    listAssistants(): Promise<TAssistant<TConfig>[]>;
    updateAssistant(
        id: string,
        updates: Partial<TAssistant<TConfig>>,
    ): Promise<TAssistant<TConfig> | undefined>;
    deleteAssistant(id: string): Promise<boolean>;

    // Thread operations
    createThread(thread: TSavedThread<TState>): Promise<TSavedThread<TState>>;
    getThread(id: string): Promise<TSavedThread<TState> | undefined>;
    listThreads(filter?: ThreadFilter): Promise<TSavedThread<TState>[]>;
    updateThread(
        id: string,
        updates: Partial<TSavedThread<TState>>,
    ): Promise<TSavedThread<TState> | undefined>;
    deleteThread(id: string): Promise<boolean>;

    // Lifecycle operations
    initialize(): Promise<void>;
    clear(): Promise<void>;
}
