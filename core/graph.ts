import type {
  LLMStreamMeta,
  TAnnotation,
  TAssistant,
  TGraphDef,
  TStreamYield,
  TThread,
} from "./types.ts";
import { AssistantManager } from "./assistant.ts";
import { type DataStore } from "./storage/index.ts";
import { ThreadManager } from "./thread.ts";
import type {
  AIMessageChunk,
  ToolMessageChunk,
} from "@langchain/core/messages";

// Applies type constraints when creating a graph definitiaon
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
 * Configuration for creating a GraphManager
 */
export interface GraphManagerConfig {
  graphConfig: TGraphDef<tstateannotation, tconfigannotation>;
  assistantStore: DataStore<TAssistant<TConfigAnnotation>>;
  threadStore: DataStore<TThread<TStateAnnotation>>;
}

/**
 * Manages all aspects of a graph, including assistants, threads, and runs
 * Acts as the main entry point for graph-related operations
 * @template TStateAnnotation - The state type annotation
 * @template TConfigAnnotation - The config type annotation
 */
export class GraphStateManager<
  TStateAnnotation extends TAnnotation,
  TConfigAnnotation extends TAnnotation,
> {
  protected assistants: AssistantManager<TConfigAnnotation>;
  protected threads: ThreadManager<TStateAnnotation>;
  protected graphConfig: TGraphDef<TStateAnnotation, TConfigAnnotation>;

  /**
   * Creates a new GraphManager
   * @param config - Configuration for the graph manager
   */
  constructor(
    config: GraphManagerConfig<TStateAnnotation, TConfigAnnotation>,
  ) {
    this.graphConfig = config.graphConfig;

    // Initialize managers with their respective stores
    this.assistants = new AssistantManager(
      this.graphConfig,
      config.assistantStore,
    );

    this.threads = new ThreadManager(
      config.threadStore,
    );
  }

  /**
   * Initializes all managers
   */
  async initialize(): Promise<void> {
    await Promise.all([
      this.assistants.initialize(),
    ]);
  }

  /**
   * Gets the assistant manager
   */
  getAssistantManager(): AssistantManager<TConfigAnnotation> {
    return this.assistants;
  }

  /**
   * Gets the thread manager
   */
  getThreadManager(): ThreadManager<TStateAnnotation> {
    return this.threads;
  }

  /**
   * Gets all assistants for this graph
   */
  async getAssistants(): Promise<TAssistant<TConfigAnnotation>[]> {
    return await this.assistants.listAllAssistants();
  }

  /**
   * Gets all threads for this graph
   */
  async getThreads(): Promise<TThread<TStateAnnotation>[]> {
    return await this.threads.listAllThreads();
  }

  /**
   * Creates a new assistant
   * @param config - Configuration for the assistant
   */
  async createAssistant(
    config: Omit<TAssistant<TConfigAnnotation>, "id">,
  ): Promise<TAssistant<TConfigAnnotation>> {
    return await this.assistants.createAssistant({
      id: `assistant_${crypto.randomUUID()}`,
      ...config,
    });
  }

  /**
   * Creates a new thread
   * @param config - Configuration for the thread
   */
  async createThread(
    config?: Partial<TThread<TStateAnnotation>>,
  ): Promise<TThread<TStateAnnotation>> {
    return this.threads.createThread({
      // id: `thread_${crypto.randomUUID()}`,
      // created_at: new Date(),
      // ...config,
    });
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
    state?: TStateAnnotation["State"];
    config?: TConfigAnnotation["State"];
  }): Promise<TStateAnnotation["State"]> {
    // Get the assistant that will be used on this run
    let assistant: TAssistant<TConfigAnnotation> | undefined;
    if (!assistantId) {
      assistant = await this.assistants.getDefaultAssistant();
    } else {
      assistant = await this.assistants.get(assistantId);
    }
    if (!assistant) {
      throw new Error(`Assistant ${assistantId} not found`);
    }

    // Get the thread that will be used on this run
    let thread: TThread<TStateAnnotation> | undefined;
    if (threadId) {
      thread = await this.threads.get(threadId);
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
      await this.threads.saveThreadState(thread.id, res);
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
    state?: TStateAnnotation["State"];
    config?: TConfigAnnotation["State"];
  }): AsyncGenerator<
    TStreamYield<TGraphDef<TStateAnnotation, TConfigAnnotation>>
  > {
    // Get the assistant that will be used on this run
    let assistant: TAssistant<TConfigAnnotation> | undefined;
    if (!assistantId) {
      assistant = await this.assistants.getDefaultAssistant();
    } else {
      assistant = await this.assistants.get(assistantId);
    }
    if (!assistant) {
      throw new Error(`Assistant ${assistantId} not found`);
    }

    // Get the thread that will be used on this run
    let thread: TThread<TStateAnnotation> | undefined;
    if (threadId) {
      thread = await this.threads.get(threadId);
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

    let finalState: TStateAnnotation["State"] | undefined;

    // Helper to check if the meta tags of the chunk match any of the stream keys. If yes, returns the state key
    const getStreamKeyFromMetaTags = <T>(
      keys: Record<string, any>, // T[] | undefined,
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
        let _data = data as TStateAnnotation["State"];
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
        const state_stream_keys = this.graphConfig.state_llm_stream_keys;

        const state_key = getStreamKeyFromMetaTags(
          state_stream_keys,
          meta.tags,
        );
        if (key) {
          yield {
            state_llm_stream_data: {
              key,
              value: chunk,
            },
          };
        }
      }
    }

    // Save the final state to the thread
    if (thread && finalState) {
      await this.threads.saveThreadState(thread.id, finalState);
    }
  }
}
