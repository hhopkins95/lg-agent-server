import type {
  LLMStreamMeta,
  TAnnotation,
  TAssistant,
  TGetRunConfigParams,
  TGraphDef,
  TStreamYield,
  TThread,
} from "./types.ts";
import type { AppStorage, ThreadFilter } from "./storage/types.ts";
import type {
  AIMessageChunk,
  ToolMessageChunk,
} from "@langchain/core/messages";
import {
  type BaseCheckpointSaver,
  Command,
  MemorySaver,
} from "@langchain/langgraph";
import { SQLiteAppStorage } from "./storage/sqlite.ts";
import type { TInterrupt } from "@/lib/utils/interrupt-graph.ts";
import { DEFAULT_ASSISTANT_ID } from "./constants.ts";
import { awaitAllCallbacks } from "@langchain/core/callbacks/promises";

/**
 * TODO :
 *
 * - update to use 2 persistence layers.
 *
 * 1. Checkpointer
 *  - follows langgraph api def.
 *  - used to retrieve / store full current state of a thread (and checkpoints), including interrupts
 *
 * 2. AppStorage
 *  - storage for assistants, and [final] thread states (any time the graph reaches the __END__ node, we will update this)
 *
 * Reasoning :
 * the checkpointer automatically tracks everything we need for runs / checkpoints, but no built in way to query threads / assistants. Only the thread_id can be used as a query param. We need our own storage to manage who has access to what threads, and a way to actually query them.
 *
 * Checkpointer will store the history for any given thread and interrupt values. Any time the state settles, it will be stored in the app storage. So, if the checkpointer ever goes down / switches, the app storage will have the latest state. We will generally get the state from the checkpointer first because it will be more up to date, and then fall back to the app storage if necessary. This just makes the app storage exportable. App storage of the thread will also have other app-specific data, like user_id, assistant_id, etc.
 *
 * Can still pass the same db to the checkpointer and the app storage, but we'll have seperate interfaces in case they are ever decoupled.
 *
 * ---
 * Update getting thread state logic to first check the checkpointer, then the app storage.
 *
 * Update thread type to include status, which should now include any interrupted data (so it can be resumed).
 *
 *  /////
 * HOW THIS SHOULD BE DONE :
 * refactor / remove the current DataStore interface, and make one specific for assistants and threads.That will be the app storage. Create a new class for the app storage. Should expose all of the same methods that we are currently using. Basically just combines the AssistantStore and ThreadStore into one, but with better interaction between them.
 *
 * Create a SQLLite implementation of this class.
 *
 * Checkpointer comes directly from langgraph and is attached directly to the graph.
 *
 * Graph state manager should be initialized with a AppStorage class and a Checkpointer class.
 */

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
  protected appStorage: AppStorage<
    TGraph["config_annotation"],
    TGraph["state_annotation"]
  >;
  protected checkpointer: BaseCheckpointSaver;
  protected graphConfig: TGraph;

  /**
   * Creates a new GraphManager
   * @param graphConfig - The graph configuration. Create using 'CreateGraphDef'
   * @param appStorage - The storage for assistants and threads
   * @param checkpointer - Optional langgraph checkpointer for run history and interrupts
   */
  constructor(
    graphConfig: TGraph,
    appStorage?: AppStorage<
      TGraph["config_annotation"],
      TGraph["state_annotation"]
    >,
    checkpointer?: BaseCheckpointSaver,
  ) {
    this.graphConfig = graphConfig;
    this.appStorage = appStorage ?? new SQLiteAppStorage(":memory:");
    this.checkpointer = checkpointer ?? new MemorySaver();
    this.graphConfig.graph.checkpointer = this.checkpointer;
  }

  /**
   * Initializes all managers
   */
  async initialize(): Promise<void> {
    // Initialize app storage
    await this.appStorage.initialize();

    // Load default assistants
    await this.loadAssistantsFromConfig();
  }

  protected async loadAssistantsFromConfig() {
    const should_upsert = false; // TODO -- pass this in through config
    const all_assistants: TAssistant<TGraph["config_annotation"]>[] = [];

    if (this.graphConfig.default_config) {
      const config = this.graphConfig.default_config;
      all_assistants.push({
        id: DEFAULT_ASSISTANT_ID,
        graph_name: this.graphConfig.name,
        description: `Default configuration for ${this.graphConfig.name}`,
        config,
      });
    }

    if (this.graphConfig.launch_assistants) {
      all_assistants.push(...this.graphConfig.launch_assistants);
    }

    for (const assistant of all_assistants) {
      const existing = await this.appStorage.getAssistant(assistant.id);
      if (!existing) {
        await this.appStorage.createAssistant(assistant);
        continue;
      }
      if (should_upsert) {
        await this.appStorage.updateAssistant(assistant.id, assistant);
      }
    }
  }

  // Assistant Management Methods
  async getAssistant(
    id: string,
  ): Promise<TAssistant<TGraph["config_annotation"]> | undefined> {
    return await this.appStorage.getAssistant(id);
  }

  async listAllAssistants(): Promise<
    TAssistant<TGraph["config_annotation"]>[]
  > {
    return await this.appStorage.listAssistants();
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
    return this.appStorage.createAssistant(assistantWithId);
  }

  async updateAssistant(
    id: string,
    updates: Partial<TAssistant<TGraph["config_annotation"]>>,
  ): Promise<TAssistant<TGraph["config_annotation"]> | undefined> {
    return this.appStorage.updateAssistant(id, updates);
  }

  async deleteAssistant(id: string): Promise<boolean> {
    return this.appStorage.deleteAssistant(id);
  }

  // Thread Management
  listThreads = (filter?: ThreadFilter) => this.appStorage.listThreads(filter);
  getThread = (id: string) => this.appStorage.getThread(id);

  async createThread(
    assistant_id: string,
  ): Promise<TThread<TGraph["state_annotation"]>> {
    // make sure the assistant exists
    const assistant = await this.appStorage.getAssistant(assistant_id);
    if (!assistant) {
      throw new Error(`Assistant ${assistant_id} not found`);
    }
    return await this.appStorage.createThread({
      id: `thread_${crypto.randomUUID()}`,
      assistant_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      values: this.graphConfig.default_state,
      status: {
        status: "idle",
      },
    });
  }

  private async updateThread(
    threadId: string,
    values: Partial<Omit<TThread<TGraph["state_annotation"]>, "id">>,
  ): Promise<TThread<TGraph["state_annotation"]>> {
    // Always save to app storage
    const res = await this.appStorage.updateThread(threadId, {
      ...values,
      updated_at: new Date().toISOString(),
    });
    if (!res) {
      throw new Error(`Thread ${threadId} not found`);
    }
    return res;
  }

  /*
  Invocations
  */

  /**
   * Get's the configuration for a run of the graph depending on the passed parameters
   */
  private async getRunConfig({
    assistant_id,
    thread_id,
    config,
  }: TGetRunConfigParams<typeof this.graphConfig>) {
    let assistant: TAssistant<TGraph["config_annotation"]> | undefined =
      await this.appStorage.getAssistant(assistant_id ?? DEFAULT_ASSISTANT_ID);

    if (!assistant) {
      throw new Error(`Cannot find assistant for run`);
    }
    return {
      configurable: {
        ...assistant.config,
        ...config,
        thread_id,
      },
    };
  }

  async resumeThreadFromInterrupt(
    { thread_id, val, stream = false, config }: {
      thread_id: string;
      val: unknown;
      stream?: boolean;
      config?: Partial<TGraph["config_annotation"]["State"]>;
    },
  ) {
    const thread = await this.getThread(thread_id);
    if (!thread) {
      throw new Error(`Thread ${thread_id} not found`);
    }
    if (thread.status.status !== "interrupted") {
      throw new Error(`Thread ${thread_id} is not in an interrupted state`);
    }
    const runConfig = await this.getRunConfig({
      thread_id,
      config,
    });
    await this.graphConfig.graph.invoke(
      new Command({ resume: val }),
      runConfig,
    );
  }

  // Keep existing invoke and stream implementations
  async invokeGraph({
    state,
    resumeValue,
    assistant_id,
    thread_id,
    config,
  }: {
    state?: TGraph["state_annotation"]["State"];
    resumeValue?: unknown;
  } & TGetRunConfigParams<typeof this.graphConfig>): Promise<
    { success: true; values: TGraph["state_annotation"]["State"] } | {
      success: false;
      values?: TGraph["state_annotation"]["State"];
      error: string;
    }
  > {
    if ((!resumeValue && !state) || (resumeValue && state)) {
      throw new Error("Exactly one of state or resumeValue must be provided");
    }

    // Get the assistant that will be used on this run
    const invokeConfig = await this.getRunConfig({
      assistant_id,
      thread_id,
      config,
    });

    // Get the state / config for this run
    const invokeVal = state ?? new Command({ resume: resumeValue }); // TODO -- resumeValue

    try {
      if (thread_id) {
        await this.updateThread(thread_id, {
          status: {
            status: "running",
          },
        });
      }
      const res = await this.graphConfig.graph.invoke(invokeVal, invokeConfig);
      if (thread_id) {
        await this.updateThread(thread_id, {
          values: res,
          status: {
            status: "idle",
          },
        });
      }
      return { success: true, values: res };
    } catch (e) {
      let latest_values: TGraph["state_annotation"]["State"] | undefined;
      if (thread_id) {
        // get latest state from the run via checkpointer
        latest_values =
          (await (this.graphConfig.graph.getState(invokeConfig))).values;

        // save that to the thread if exists along with the error
        await this.updateThread(thread_id, {
          values: latest_values,
          status: {
            status: "error",
            error: (e as Error).message,
          },
        });
      }
      return {
        success: false,
        error: (e as Error).message,
      };
    }
  }
  // Needs update
  async *streamGraph({
    state,
    resumeValue,
    assistant_id,
    thread_id,
    config,
  }: {
    state?: TGraph["state_annotation"]["State"];
    resumeValue?: unknown;
  } & TGetRunConfigParams<typeof this.graphConfig>): AsyncGenerator<
    TStreamYield<TGraph>
  > {
    if ((!resumeValue && !state) || (resumeValue && state)) {
      throw new Error("Exactly one of state or resumeValue must be provided");
    }

    // Get the assistant that will be used on this run

    const invokeConfig = await this.getRunConfig({
      assistant_id,
      thread_id,
      config,
    });

    // Get the state / config for this run
    const invokeVal = state ?? new Command({ resume: resumeValue });

    // Use the graph's stream method instead of invoke
    const stream = await this.graphConfig.graph.stream(invokeVal, {
      streamMode: ["values", "messages", "custom"],
      ...invokeConfig,
    });

    if (thread_id) {
      await this.updateThread(thread_id, {
        status: {
          status: "running",
        },
      });
    }

    // Yield each state update
    for await (const [eventType, data] of stream) {
      if (eventType == "custom" && data.type == "interrupt") {
        const interruptData = data.data as TInterrupt;
      }

      // full state update event
      if (eventType == "values") {
        let _data = data as TGraph["state_annotation"]["State"];
        if (thread_id) {
          await this.updateThread(thread_id, {
            values: _data,
          });
          yield {
            full_state_update: state,
          };
        }
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
              chunk,
              meta,
            },
          };
          continue;
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
              chunk: chunk,
              meta,
            },
          };
        }
      }
    }
  }
}

// Helper to check if the meta tags of the chunk match any of the stream keys
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
