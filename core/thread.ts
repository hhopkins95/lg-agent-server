import { DataStoreFilter } from "@/models/storage/types.ts";
import { GraphServerConfiguration, Thread, ThreadSchema } from "./types_old.ts";
import { DataStore } from "../../core./src/models/storage/index.ts";

/**
 * Manages threads for a specific graph type
 * @template T - The specific graph type being managed
 */
export class ThreadManager<T extends GraphServerConfiguration> {
  /**
   * Creates a new ThreadManager
   * @param graphConfig - The graph this manager is associated with
   * @param store - The storage implementation to use
   */
  constructor(
    protected graphConfig: T,
    protected store: DataStore<Thread<T["state_schema"]>>,
  ) {
  }

  /**
   * List all threads for this given graph
   */
  async listAllThreads(): Promise<Thread[]> {
    return await this.store.list();
  }

  /**
   * Lists threads by assistant
   * @param assistantId - ID of the assistant to filter by
   */
  async listThreadsByAssistant(
    assistantId: string,
  ): Promise<Thread[]> {
    return await this.store.query({
      assistant_id: { $eq: assistantId },
    } as DataStoreFilter<Thread<T["state_schema"]>>);
  }

  /**
   * Creates a new thread
   * @param thread - The thread to create
   */
  async createThread(thread: Thread): Promise<Thread<T["state_schema"]>> {
    // Validate against schema before storing
    // ThreadSchema(this.graphConfig.state_schema).parse(thread);
    return await this.store.create(thread);
  }

  /**
   * Updates an existing thread
   * @param id - ID of the thread to update
   * @param updates - Updates to apply
   */
  async updateThread(
    threadId: string,
    updates: Partial<Thread>,
  ): Promise<Thread<T["state_schema"]> | undefined> {
    const existing = await this.get(threadId);
    if (!existing) return undefined;

    const updated: Partial<Thread<T["state_schema"]>> = {
      ...existing,
      ...updates,
      updated_at: new Date(),
    };
    // Validate updated thread
    // ThreadSchema(this.graphConfig.state_schema).parse(updated);

    return this.store.update(threadId, updated);
  }

  /** */
  async get(threadId: string): Promise<Thread<T["state_schema"]> | undefined> {
    return await this.store.get(threadId);
  }

  /**
   * Gets the current state of a thread
   * @param threadId - ID of the thread
   * @param checkpointId - Optional checkpoint ID to retrieve
   */
  async getThreadState(
    threadId: string,
    // checkpointId?: string,
  ): Promise<Thread<T["state_schema"]>["cur_state"] | undefined> {
    const thread = await this.get(threadId);
    if (!thread) return undefined;

    // if (!checkpointId) {
    //   return thread.cur_state;
    // }

    return thread.cur_state;

    // // If checkpoint ID is provided and store supports checkpoints
    // if (this.supportsCheckpoints()) {
    //   try {
    //     const state = await (this.store as CheckpointStore<Thread<T>>)
    //       .getCheckpoint(threadId, checkpointId);
    //     return ThreadStateSchema(this.graphConfig).parse(state);
    //   } catch {
    //     return undefined;
    //   }
    // }

    // return undefined;
  }

  /**
   * Saves the current state of a thread
   * @param threadId - ID of the thread
   * @param state - State to save
   */
  async saveThreadState(
    threadId: string,
    state: Thread<T["state_schema"]>["cur_state"],
  ): Promise<void> {
    // Validate state against schema
    // ThreadStateSchema(this.graphConfig.state_schema).parse(state);

    await this.store.update(threadId, {
      cur_state: state,
      updated_at: new Date().toISOString(),
    } as Partial<Thread<T["state_schema"]>>);

    // await this.update(threadId, {
    //   cur_state: state,
    //   updated_at: new Date(),
    // });
  }

  // /**
  //  * Creates a checkpoint of the current thread state
  //  * @param threadId - ID of the thread
  //  * @param state - State to checkpoint
  //  */
  // async createCheckpoint(
  //   threadId: string,
  //   state: Thread<T>["cur_state"],
  // ): Promise<string | undefined> {
  //   // Validate state
  //   ThreadStateSchema(this.graphConfig).parse(state);

  //   if (this.supportsCheckpoints()) {
  //     return (this.store as CheckpointStore<Thread<T>>)
  //       .createCheckpoint(threadId, state);
  //   }

  //   return undefined;
  // }

  // /**
  //  * Checks if the store supports checkpointing
  //  * @private
  //  */
  // private supportsCheckpoints(): boolean {
  //   return "createCheckpoint" in this.store;
  // }
}
