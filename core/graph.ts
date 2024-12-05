import type { TAnnotation } from "@/lib/utils/type-helpers.ts";
import type { TAssistant, TGraphDef, TThread } from "./types.ts";
import { AssistantManager } from "./assistant.ts";
import { type DataStore } from "./storage/index.ts";
import { ThreadManager } from "./thread.ts";

/**
 * Configuration for creating a GraphManager
 */
export interface GraphManagerConfig<
  TState extends TAnnotation,
  TInput extends TAnnotation,
  TOutput extends TAnnotation,
  TConfig extends TAnnotation,
> {
  graphConfig: TGraphDef<TState, TInput, TOutput, TConfig>;
  assistantStore: DataStore<TAssistant<TConfig>>;
  threadStore: DataStore<TThread<TState>>;
}

/**
 * Manages all aspects of a graph, including assistants, threads, and runs
 * Acts as the main entry point for graph-related operations
 * @template TState - The state type annotation
 * @template TInput - The input type annotation
 * @template TOutput - The output type annotation
 * @template TConfig - The config type annotation
 */
export class GraphStateManager<
  TState extends TAnnotation,
  TInput extends TAnnotation,
  TOutput extends TAnnotation,
  TConfig extends TAnnotation,
> {
  protected assistants: AssistantManager<TConfig>;
  protected threads: ThreadManager<TState>;
  protected graphConfig: TGraphDef<TState, TInput, TOutput, TConfig>;

  /**
   * Creates a new GraphManager
   * @param config - Configuration for the graph manager
   */
  constructor(
    config: GraphManagerConfig<TState, TInput, TOutput, TConfig>,
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
  getAssistantManager(): AssistantManager<TConfig> {
    return this.assistants;
  }

  /**
   * Gets the thread manager
   */
  getThreadManager(): ThreadManager<TState> {
    return this.threads;
  }

  /**
   * Gets all assistants for this graph
   */
  async getAssistants(): Promise<TAssistant<TConfig>[]> {
    return await this.assistants.listAllAssistants();
  }

  /**
   * Gets all threads for this graph
   */
  async getThreads(): Promise<TThread<TState>[]> {
    return await this.threads.listAllThreads();
  }

  /**
   * Creates a new assistant
   * @param config - Configuration for the assistant
   */
  async createAssistant(
    config: Omit<TAssistant<TConfig>, "id">,
  ): Promise<TAssistant<TConfig>> {
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
    config?: Partial<TThread<TState>>,
  ): Promise<TThread<TState>> {
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
    state?: TState["State"];
    config?: TConfig["State"];
  }): Promise<TState["State"]> {
    // Get the assistant that will be used on this run
    let assistant: TAssistant<TConfig> | undefined;
    if (!assistantId) {
      assistant = await this.assistants.getDefaultAssistant();
    } else {
      assistant = await this.assistants.get(assistantId);
    }
    if (!assistant) {
      throw new Error(`Assistant ${assistantId} not found`);
    }

    // Get the thread that will be used on this run
    let thread: TThread<TState> | undefined;
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
    state?: TState["State"];
    config?: TConfig["State"];
  }): AsyncGenerator<TState["State"]> {
    // Get the assistant that will be used on this run
    let assistant: TAssistant<TConfig> | undefined;
    if (!assistantId) {
      assistant = await this.assistants.getDefaultAssistant();
    } else {
      assistant = await this.assistants.get(assistantId);
    }
    if (!assistant) {
      throw new Error(`Assistant ${assistantId} not found`);
    }

    // Get the thread that will be used on this run
    let thread: TThread<TState> | undefined;
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
      streamMode: "values",
    });

    let finalState: TState["State"] | undefined;

    // Yield each state update
    for await (const update of stream) {
      finalState = update;
      yield update;
    }

    // Save the final state to the thread
    if (thread && finalState) {
      await this.threads.saveThreadState(thread.id, finalState);
    }
  }
}
