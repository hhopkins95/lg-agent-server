import type { TAnnotation, TAssistant, TThread } from "../types.ts";

/**
 * Generic filter type for querying data stores (Legacy - to be removed)
 */
export type DataStoreFilter<T> =
    & {
        [K in keyof T]?: T[K] | {
            $eq?: T[K];
            $ne?: T[K];
            $in?: T[K][];
            $exists?: boolean;
        };
    }
    & {
        metadata?: Record<string, unknown>;
    };

/**
 * Legacy DataStore interface (to be removed after GraphStateManager update)
 */
export interface DataStore<T extends { id: string }> {
    create(item: T): Promise<T>;
    get(id: string): Promise<T | undefined>;
    list(): Promise<T[]>;
    update(id: string, updates: Partial<T>): Promise<T | undefined>;
    delete(id: string): Promise<boolean>;
    batchGet(ids: string[]): Promise<T[]>;
    batchCreate(items: T[]): Promise<T[]>;
    query(filter: DataStoreFilter<T>): Promise<T[]>;
    initialize?(): Promise<void>;
    clear(): Promise<void>;
}

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
    createThread(thread: TThread<TState>): Promise<TThread<TState>>;
    getThread(id: string): Promise<TThread<TState> | undefined>;
    listThreads(filter?: ThreadFilter): Promise<TThread<TState>[]>;
    updateThread(
        id: string,
        updates: Partial<TThread<TState>>,
    ): Promise<TThread<TState> | undefined>;
    deleteThread(id: string): Promise<boolean>;

    // Lifecycle operations
    initialize(): Promise<void>;
    clear(): Promise<void>;
}
