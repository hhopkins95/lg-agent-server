import type {
  LLMStreamMeta,
  TAnnotation,
  TAssistant,
  TGraphDef,
  TStreamYield,
  TThread,
} from "./types.ts";
import type { DataStore, DataStoreFilter } from "./storage/index.ts";
import type {
  AIMessageChunk,
  ToolMessageChunk,
} from "@langchain/core/messages";

/**
 *  Applies type constraints when creating a graph definitiaon
 */
export function CreateGraphDef<
  TStateAnnotation extends TAnnotation,
  TConfigAnnotation extends TAnnotation,
  TStateStreamKeys extends keyof TStateAnnotation["State"] =
    keyof TStateAnnotation["State"],
  TOtherStreamKeys extends string = string,
>(
  def: TGraphDef<
    TStateAnnotation,
    TConfigAnnotation,
    TStateStreamKeys,
    TOtherStreamKeys
  >,
) {
  return def;
}

/**
 * Manages all aspects of a graph, including assistants, threads, and runs
 * Acts as the main entry point for graph-related operations
 * @template TGraph - The graph definition
 */
export class GraphStateManager<TGraph extends TGraphDef> {
  protected assistantStore: DataStore<TAssistant<TGraph["config_annotation"]>>;
  protected threadStore: DataStore<TThread<TGraph["state_annotation"]>>;
  protected graphConfig: TGraph;

  /**
   * Creates a new GraphManager
   * @param graphConfig - The graph configuration. Create using 'CreateGraphDef'
   * @param assistantStore - The storage for the assistant
   * @param threadStore - The storage for the threads
   */
  constructor(
    graphConfig: TGraph,
    assistantStore: DataStore<TAssistant<TGraph["config_annotation"]>>,
    threadStore: DataStore<TThread<TGraph["state_annotation"]>>,
  ) {
    this.graphConfig = graphConfig;
    this.assistantStore = assistantStore;
    this.threadStore = threadStore;
  }

  /**
   * Initializes all managers
   */
  async initialize(): Promise<void> {
    // Initialize stores
    this.assistantStore.initialize && await this.assistantStore.initialize();
    this.threadStore.initialize && await this.threadStore.initialize();

    // Load default assistants
    await this.loadAssistantsFromConfig();
  }

  protected async loadAssistantsFromConfig() {
    const should_upsert = false; // TODO -- pass this in through config
    const all_assistants: TAssistant<TGraph["config_annotation"]>[] = [];

    if (this.graphConfig.default_config) {
      const config = this.graphConfig.default_config;
      all_assistants.push({
        id: "__DEFAULT__",
        graph_name: this.graphConfig.name,
        description: `Default configuration for ${this.graphConfig.name}`,
        config,
      });
    }

    if (this.graphConfig.launch_assistants) {
      all_assistants.push(...this.graphConfig.launch_assistants);
    }

    for (const assistant of all_assistants) {
      const existing = await this.assistantStore.get(assistant.id);
      if (!existing) {
        await this.createAssistant(assistant);
        continue;
      }
      if (should_upsert) {
        await this.updateAssistant(assistant.id, assistant);
      }
    }
  }

  // Assistant Management Methods
  async getAssistant(
    id: string,
  ): Promise<TAssistant<TGraph["config_annotation"]> | undefined> {
    return await this.assistantStore.get(id);
  }

  async getDefaultAssistant(): Promise<
    TAssistant<TGraph["config_annotation"]> | undefined
  > {
    return await this.assistantStore.get("__DEFAULT__");
  }

  async listAllAssistants(): Promise<
    TAssistant<TGraph["config_annotation"]>[]
  > {
    return await this.assistantStore.list();
  }

  async createAssistant(
    assistant: Omit<TAssistant<TGraph["config_annotation"]>, "id"> & {
      id?: string;
    },
  ): Promise<TAssistant<TGraph["config_annotation"]>> {
    const assistantWithId = {
      id: assistant.id ?? `assistant_${crypto.randomUUID()}`,
      ...assistant,
    };
    return this.assistantStore.create(assistantWithId);
  }

  async updateAssistant(
    id: string,
    updates: Partial<TAssistant<TGraph["config_annotation"]>>,
  ): Promise<TAssistant<TGraph["config_annotation"]> | undefined> {
    const existing = await this.getAssistant(id);
    if (!existing) return undefined;
    return this.assistantStore.update(id, { ...existing, ...updates });
  }

  // Thread Management Methods
  async listAllThreads(): Promise<TThread<TGraph["state_annotation"]>[]> {
    return await this.threadStore.list();
  }

  async listThreadsByAssistant(
    assistantId: string,
  ): Promise<TThread<TGraph["state_annotation"]>[]> {
    return await this.threadStore.query({
      assistant_id: { $eq: assistantId },
    } as DataStoreFilter<TThread<TGraph["state_annotation"]>>);
  }

  async createThread(
    data?: Partial<TThread<TGraph["state_annotation"]>>,
  ): Promise<TThread<TGraph["state_annotation"]>> {
    return await this.threadStore.create({
      id: `thread_${crypto.randomUUID()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "idle",
      ...data,
    });
  }

  async getThread(
    threadId: string,
  ): Promise<TThread<TGraph["state_annotation"]> | undefined> {
    return await this.threadStore.get(threadId);
  }

  async updateThread(
    threadId: string,
    updates: Partial<TThread<TGraph["state_annotation"]>>,
  ): Promise<TThread<TGraph["state_annotation"]> | undefined> {
    const existing = await this.getThread(threadId);
    if (!existing) return undefined;

    const updated: Partial<TThread<TGraph["state_annotation"]>> = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    return this.threadStore.update(threadId, updated);
  }

  async getThreadState(
    threadId: string,
  ): Promise<TGraph["state_annotation"]["State"] | undefined> {
    const thread = await this.getThread(threadId);
    if (!thread) return undefined;
    return thread.values;
  }

  async saveThreadState(
    threadId: string,
    state: TGraph["state_annotation"]["State"],
  ): Promise<void> {
    await this.threadStore.update(threadId, {
      values: state,
      updated_at: new Date().toISOString(),
    } as Partial<TThread<TGraph["state_annotation"]>>);
  }

  /**
   * Invoke Graph and wait for it to complete
   *
   * @param assistantId - ID of the assistant to use
   * @param threadId - ID of the thread to use
   * @param shouldCreateThread - Whether to create a new thread if one does not exist
   * @param state - Initial state for the thread
   * @param config - Configuration for the thread
   */
  async invokeGraph({
    assistantId,
    threadId,
    shouldCreateThread,
    state,
    config,
  }: {
    assistantId?: string;
    threadId?: string;
    shouldCreateThread?: boolean;
    state?: TGraph["state_annotation"]["State"];
    config?: TGraph["config_annotation"]["State"];
  }): Promise<TGraph["state_annotation"]["State"]> {
    // Get the assistant that will be used on this run
    let assistant: TAssistant<TGraph["config_annotation"]> | undefined;
    if (!assistantId) {
      assistant = await this.getDefaultAssistant();
    } else {
      assistant = await this.getAssistant(assistantId);
    }
    if (!assistant) {
      throw new Error(`Assistant ${assistantId} not found`);
    }

    // Get the thread that will be used on this run
    let thread: TThread<TGraph["state_annotation"]> | undefined;
    if (threadId) {
      thread = await this.getThread(threadId);
    }
    if (shouldCreateThread && !thread) {
      thread = await this.createThread();
    }

    // Get the state / config for this run
    const invokeState = state ?? thread?.values ??
      this.graphConfig.default_state;

    const invokeConfig = config ?? assistant.config ??
      this.graphConfig.default_config;

    const res = await this.graphConfig.graph.invoke(invokeState, {
      configurable: {
        ...invokeConfig,
      },
    });

    if (thread) {
      await this.saveThreadState(thread.id, res);
    }

    return res;
  }

  /**
   * Stream Graph execution and get real-time updates
   *
   * @param assistantId - ID of the assistant to use
   * @param threadId - ID of the thread to use
   * @param shouldCreateThread - Whether to create a new thread if one does not exist
   * @param state - Initial state for the thread
   * @param config - Configuration for the thread
   */

  async *streamGraph({
    assistantId,
    threadId,
    shouldCreateThread,
    state,
    config,
  }: {
    assistantId?: string;
    threadId?: string;
    shouldCreateThread?: boolean;
    state?: TGraph["state_annotation"]["State"];
    config?: TGraph["config_annotation"]["State"];
  }): AsyncGenerator<
    TStreamYield<TGraph>
  > {
    // Get the assistant that will be used on this run
    let assistant: TAssistant<TGraph["config_annotation"]> | undefined;
    if (!assistantId) {
      assistant = await this.getDefaultAssistant();
    } else {
      assistant = await this.getAssistant(assistantId);
    }
    if (!assistant) {
      throw new Error(`Assistant ${assistantId} not found`);
    }

    // Get the thread that will be used on this run
    let thread: TThread<TGraph["state_annotation"]> | undefined;
    if (threadId) {
      thread = await this.getThread(threadId);
    }
    if (shouldCreateThread && !thread) {
      thread = await this.createThread();
    }

    // Get the state / config for this run
    const invokeState = state ?? thread?.values ??
      this.graphConfig.default_state;
    const invokeConfig = config ?? assistant.config ??
      this.graphConfig.default_config;

    // Use the graph's stream method instead of invoke
    const stream = await this.graphConfig.graph.stream(invokeState, {
      configurable: {
        ...invokeConfig,
      },
      streamMode: ["values", "messages"],
    });

    let finalState: TGraph["state_annotation"]["State"] | undefined;

    // Helper to check if the meta tags of the chunk match any of the stream keys. If yes, returns the state key
    const getStreamKeyFromMetaTags = <T>(
      keys: T[] | undefined,
      tags: string[] | undefined,
    ): T | undefined => {
      if (!keys) return undefined;
      if (!tags) return undefined;

      for (const key of keys) {
        if (tags.includes(key as string)) {
          return key as T;
        }
      }
      return undefined;
    };

    // Yield each state update
    for await (const [eventType, data] of stream) {
      // full state update event
      if (eventType == "values") {
        let _data = data as TGraph["state_annotation"]["State"];
        finalState = _data;
        // console.log("State Update : ", _data);
        yield {
          full_state_update: _data,
        };
      }

      // LLM stream event
      if (eventType == "messages") {
        const [chunk, meta] = data as [
          AIMessageChunk | ToolMessageChunk,
          LLMStreamMeta,
        ];

        // Check if the streamed tags match any of the state stream keys
        const state_stream_keys = this.graphConfig.state_llm_stream_keys;
        const state_key = getStreamKeyFromMetaTags(
          state_stream_keys,
          meta.tags,
        );
        if (state_key) {
          yield {
            state_llm_stream_data: {
              // @ts-ignore
              key: state_key,
              value: chunk,
              meta,
            },
          };
        }

        // Check if the streamed tags match any of the other stream keys
        const other_stream_keys = this.graphConfig.other_llm_stream_keys;
        const other_key = getStreamKeyFromMetaTags(
          other_stream_keys,
          meta.tags,
        );
        if (other_key) {
          yield {
            other_llm_stream_data: {
              // @ts-ignore
              key: other_key,
              value: chunk,
              meta,
            },
          };
        }
      }
    }

    // Save the final state to the thread
    if (thread && finalState) {
      await this.saveThreadState(thread.id, finalState);
    }
  }
}
