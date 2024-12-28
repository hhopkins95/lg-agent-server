import type {
    TAnnotation,
    TAssistant,
    TThread,
    TThreadStatus,
} from "../types.ts";

/**
 * Filter type for querying threads
 */
export type ThreadFilter = {
    assistant_id?: string;
    status?: TThreadStatus["status"];
    created_before?: string;
    created_after?: string;
};

/**
 * Application storage interface for managing assistants and threads
 */
export interface AppStorage<
    TConfig extends TAnnotation = TAnnotation,
    TGraphOutput extends TAnnotation = TAnnotation,
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
    createThread(thread: TThread<TGraphOutput>): Promise<TThread<TGraphOutput>>;
    getThread(id: string): Promise<TThread<TGraphOutput> | undefined>;
    listThreads(filter?: ThreadFilter): Promise<TThread<TGraphOutput>[]>;
    updateThread(
        id: string,
        updates: Partial<TThread<TGraphOutput>>,
    ): Promise<TThread<TGraphOutput> | undefined>;
    deleteThread(id: string): Promise<boolean>;

    // Lifecycle operations
    initialize(): Promise<void>;
    clear(): Promise<void>;
}
