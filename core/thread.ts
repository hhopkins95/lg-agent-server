import type { DataStoreFilter } from "./storage/types.ts";
import type { TGraphDef, TThread, TThreadState } from "./types.ts";
import type { DataStore } from "./storage/index.ts";
import type { TAnnotation } from "@/lib/utils/type-helpers.ts";

/**
 * Manages threads for a specific graph type
 * @template T - The specific graph type being managed
 */
export class ThreadManager<TState extends TAnnotation> {
  /**
   * Creates a new ThreadManager
   * @param store - The storage implementation to use
   */
  constructor(
    protected store: DataStore<TThread<TState>>,
  ) {
  }

  /**
   * List all threads for this given graph
   */
  async listAllThreads(): Promise<TThread<TState>[]> {
    return await this.store.list();
  }

  /**
   * Lists threads by assistant
   * @param assistantId - ID of the assistant to filter by
   */
  async listThreadsByAssistant(
    assistantId: string,
  ): Promise<TThread<TState>[]> {
    return await this.store.query({
      assistant_id: { $eq: assistantId },
    } as DataStoreFilter<TThread<TState>>);
  }

  /**
   * Creates a new thread
   * @param thread - The thread to create
   */
  async createThread(
    thread: Partial<TThread<TState>>,
  ): Promise<TThread<TState>> {
    return await this.store.create({
      id: `thread_${crypto.randomUUID()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "idle",
      ...thread,
    });
  }

  /**
   * Updates an existing thread
   * @param id - ID of the thread to update
   * @param updates - Updates to apply
   */
  async updateThread(
    threadId: string,
    updates: Partial<TThread<TState>>,
  ): Promise<TThread<TState> | undefined> {
    const existing = await this.get(threadId);
    if (!existing) return undefined;

    const updated: Partial<TThread<TState>> = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    return this.store.update(threadId, updated);
  }

  /**
   * Get a thread by ID
   */
  async get(threadId: string): Promise<TThread<TState> | undefined> {
    return await this.store.get(threadId);
  }

  /**
   * Gets the current state of a thread
   * @param threadId - ID of the thread
   */
  async getThreadState(
    threadId: string,
  ): Promise<TState["State"] | undefined> {
    const thread = await this.get(threadId);
    if (!thread) return undefined;

    return thread.values;
  }

  /**
   * Saves the current state of a thread
   * @param threadId - ID of the thread
   * @param state - State to save
   */
  async saveThreadState(
    threadId: string,
    state: TState["State"],
  ): Promise<void> {
    await this.store.update(threadId, {
      values: state,
      updated_at: new Date().toISOString(),
    } as Partial<TThread<TState>>);
  }
}
