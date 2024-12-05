import type {
  Assistant,
  GraphServerConfiguration,
  Run,
  Thread,
} from "./types_old.ts";
import { AssistantManager } from "./assistant.ts";
import { type DataStore } from "./storage/index.ts";
import { ThreadManager } from "./thread.ts";
import { type z } from "zod";

/**
 * Configuration for creating a GraphManager
 */
export interface GraphManagerConfig<
  TGraphConfig extends GraphServerConfiguration,
> {
  graphConfig: TGraphConfig;
  assistantStore: DataStore<Assistant<TGraphConfig["config_schema"]>>;
  threadStore: DataStore<Thread<TGraphConfig["state_schema"]>>;
}

/**
 * Manages all aspects of a graph, including assistants, threads, and runs
 * Acts as the main entry point for graph-related operations
 * @template T - The specific graph type being managed
 */
export class GraphStateManager<T extends GraphServerConfiguration> {
  protected assistants: AssistantManager<T>;
  protected threads: ThreadManager<T>;
  protected graphConfig: T;

  /**
   * Creates a new GraphManager
   * @param config - Configuration for the graph manager
   */
  constructor(config: GraphManagerConfig<T>) {
    this.graphConfig = config.graphConfig;

    // Initialize managers with their respective stores
    this.assistants = new AssistantManager(
      this.graphConfig,
      config.assistantStore,
    );

    this.threads = new ThreadManager(
      this.graphConfig,
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
  getAssistantManager(): AssistantManager<T> {
    return this.assistants;
  }

  /**
   * Gets the thread manager
   */
  getThreadManager(): ThreadManager<T> {
    return this.threads;
  }

  /**
   * Gets all assistants for this graph
   */
  async getAssistants(): Promise<Assistant<T["config_schema"]>[]> {
    return await this.assistants.listAllAssistants();
  }

  /**
   * Gets all threads for this graph
   */
  async getThreads(): Promise<Thread<T["state_schema"]>[]> {
    return await this.threads.listAllThreads();
  }

  /**
   * Creates a new assistant
   * @param config - Configuration for the assistant
   */

  async createAssistant(
    config: Omit<Assistant<T["config_schema"]>, "id">,
  ): Promise<Assistant<T["config_schema"]>> {
    return await this.assistants.createAssistant({
      id: `assistant_${crypto.randomUUID()}`,
      ...config,
    });
  }

  /**
   * Creates a new thread for an assistant
   * @param assistantId - ID of the assistant to create the thread for
   * @param config - Configuration for the thread
   */
  async createThread(
    config?: Partial<Thread<T["state_schema"]>>,
  ): Promise<Thread<T["state_schema"]>> {
    // const assistant = await this.assistants.get(assistantId);
    // if (!assistant) {
    //   throw new Error(`Assistant ${assistantId} not found`);
    // }
    return this.threads.createThread({
      id: `thread_${crypto.randomUUID()}`,
      created_at: new Date().toISOString(),
      ...config,
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
    state?: z.infer<T["state_schema"]>;
    config?: z.infer<T["config_schema"]>;
  }): Promise<z.infer<T["state_schema"]>> {
    // Get the assistant that will be used on this run
    let assistant: Assistant<T["config_schema"]> | undefined;
    if (!assistantId) {
      assistant = await this.assistants.getDefaultAssistant();
    } else {
      assistant = await this.assistants.get(assistantId);
    }
    if (!assistant) {
      throw new Error(`Assistant ${assistantId} not found`);
    }

    // Get the thread that will be used on this run
    let thread: Thread<T["state_schema"]> | undefined;
    if (threadId) {
      thread = await this.threads.get(threadId);
    }
    if (shouldCreateThread && !thread) {
      thread = await this.createThread();
    }

    // Get the state / config for this run
    const invokeState = state ?? thread?.cur_state ??
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
    state?: z.infer<T["state_schema"]>;
    config?: z.infer<T["config_schema"]>;
  }): AsyncGenerator<z.infer<T["state_schema"]>> {
    // Get the assistant that will be used on this run
    let assistant: Assistant<T["config_schema"]> | undefined;
    if (!assistantId) {
      assistant = await this.assistants.getDefaultAssistant();
    } else {
      assistant = await this.assistants.get(assistantId);
    }
    if (!assistant) {
      throw new Error(`Assistant ${assistantId} not found`);
    }

    // Get the thread that will be used on this run
    let thread: Thread<T["state_schema"]> | undefined;
    if (threadId) {
      thread = await this.threads.get(threadId);
    }
    if (shouldCreateThread && !thread) {
      thread = await this.createThread();
    }

    // Get the state / config for this run
    const invokeState = state ?? thread?.cur_state ??
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

    let finalState: z.infer<T["state_schema"]> | undefined;

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
