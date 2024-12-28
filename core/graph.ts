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
 *  Applies type constraints when creating a graph definitiaon
 */
export function CreateGraphDef<
  TInputAnnotation extends TAnnotation,
  TOutputAnnotation extends TAnnotation,
  TConfigAnnotation extends TAnnotation,
  TStateStreamKeys extends keyof TInputAnnotation["State"] =
    keyof TInputAnnotation["State"],
  TOtherStreamKeys extends string = string,
>(
  def: TGraphDef<
    TInputAnnotation,
    TOutputAnnotation,
    TConfigAnnotation,
    TStateStreamKeys,
    TOtherStreamKeys
  >,
) {
  return def;
}

/**
 * Manages the complete lifecycle of a graph-based application, integrating two persistence layers:
 * 1. App Storage - Manages assistants and final thread states, providing queryable storage for application data
 * 2. Checkpointer - Handles run history and interrupt states following the LangGraph API
 *
 * Key responsibilities:
 * - Assistant Management: CRUD operations for assistant configurations
 * - Thread Management: Creation and state management of conversation threads
 * - Graph Execution: Both streaming and non-streaming invocation of the graph
 * - State Persistence: Coordinated storage across both persistence layers
 * - Interrupt Handling: Support for resumable graph interruptions
 *
 * The dual storage approach ensures:
 * - Queryable access to assistants and threads
 * - Complete run history preservation
 * - Reliable state recovery
 * - Support for user permissions and thread ownership
 *
 * @template TGraph - The graph definition type that specifies state and config annotations
 */
export class GraphStateManager<TGraph extends TGraphDef> {
  protected appStorage: AppStorage<
    TGraph["config_annotation"],
    TGraph["output_annotation"]
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
      TGraph["output_annotation"]
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
  ): Promise<TThread<TGraph["output_annotation"]>> {
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
      values: {},
      status: {
        status: "idle",
      },
    });
  }

  private async updateThread(
    threadId: string,
    values: Partial<Omit<TThread<TGraph["output_annotation"]>, "id">>,
  ): Promise<TThread<TGraph["output_annotation"]>> {
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

  /**
   * Resumes execution of a thread from an interrupted state
   * @param thread_id - ID of the thread to resume
   * @param val - Value to resume with (must match what the interrupt expects)
   * @param stream - Whether to stream the execution or not
   * @param config - Additional configuration to merge with assistant config
   * @returns Either the final state or a stream of updates
   */
  resumeThreadFromInterrupt<TReturn extends boolean = false>({
    thread_id,
    val,
    stream = false as TReturn,
    config,
  }: {
    thread_id: string;
    val: unknown;
    stream?: TReturn;
    config?: Partial<TGraph["config_annotation"]["State"]>;
  }): TReturn extends true ? AsyncGenerator<TStreamYield<TGraph>>
    : Promise<
      | { success: true; values: TGraph["output_annotation"]["State"] }
      | {
        success: false;
        values?: TGraph["output_annotation"]["State"];
        error: string;
      }
    > {
    return (async () => {
      const thread = await this.getThread(thread_id);
      if (!thread) {
        throw new Error(`Thread ${thread_id} not found`);
      }
      if (thread.status.status !== "interrupted") {
        throw new Error(`Thread ${thread_id} is not in an interrupted state`);
      }

      // Call the appropriate internal method based on stream parameter
      return stream
        ? this.streamGraph({
          thread_id,
          resumeValue: val,
          config,
        })
        : this.invokeGraph({
          thread_id,
          resumeValue: val,
          config,
        });
    })() as TReturn extends true ? AsyncGenerator<TStreamYield<TGraph>>
      : Promise<
        | { success: true; values: TGraph["output_annotation"]["State"] }
        | {
          success: false;
          values?: TGraph["output_annotation"]["State"];
          error: string;
        }
      >;
  }

  // Keep existing invoke and stream implementations
  async invokeGraph({
    state,
    resumeValue,
    assistant_id,
    thread_id,
    config,
  }: {
    state?: TGraph["output_annotation"]["State"];
    resumeValue?: unknown;
  } & TGetRunConfigParams<typeof this.graphConfig>): Promise<
    { success: true; values: TGraph["output_annotation"]["State"] } | {
      success: false;
      values?: TGraph["output_annotation"]["State"];
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
      let latest_values: TGraph["output_annotation"]["State"] | undefined;
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
  /**
   * Streams the execution of a graph, yielding state updates, LLM outputs, and status changes
   * @param state - Initial state to start the graph with
   * @param resumeValue - Value to resume from an interrupt with
   * @param assistant_id - ID of the assistant to use
   * @param thread_id - ID of the thread to update
   * @param config - Additional configuration to merge with assistant config
   * @returns AsyncGenerator yielding state updates, LLM chunks, and status changes
   */
  async *streamGraph({
    state,
    resumeValue,
    assistant_id,
    thread_id,
    config,
  }: {
    state?: TGraph["output_annotation"]["State"];
    resumeValue?: unknown;
  } & TGetRunConfigParams<typeof this.graphConfig>): AsyncGenerator<
    TStreamYield<TGraph>
  > {
    if ((!resumeValue && !state) || (resumeValue && state)) {
      throw new Error("Exactly one of state or resumeValue must be provided");
    }

    // Prevent concurrent operations on the same thread
    if (thread_id) {
      const currentThread = await this.getThread(thread_id);
      if (currentThread?.status.status === "running") {
        throw new Error(`Thread ${thread_id} is already running`);
      }
    }

    try {
      const invokeConfig = await this.getRunConfig({
        assistant_id,
        thread_id,
        config,
      });

      const invokeVal = state ?? new Command({ resume: resumeValue });

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

      for await (const [eventType, data] of stream) {
        // Handle interrupts
        if (eventType === "custom" && data.type === "interrupt") {
          const interruptData = data.data as TInterrupt;
          if (thread_id) {
            await this.updateThread(thread_id, {
              status: {
                status: "interrupted",
                pending_interrupt: interruptData,
              },
            });
            yield {
              status_change: {
                status: "interrupted",
                pending_interrupt: interruptData,
              },
            };
          }
        }

        // Handle full state updates
        if (eventType === "values") {
          const _data = data as TGraph["output_annotation"]["State"];
          if (thread_id) {
            await this.updateThread(thread_id, {
              values: _data,
            });
            yield {
              full_state_update: _data,
            };
          }
        }

        // Handle LLM stream events
        if (eventType === "messages") {
          const [chunk, meta] = data as [
            AIMessageChunk | ToolMessageChunk,
            LLMStreamMeta,
          ];

          // Handle state stream keys
          const state_stream_keys = this.graphConfig.state_llm_stream_keys;
          const state_key = getStreamKeyFromMetaTags(
            state_stream_keys,
            meta.tags,
          );

          if (state_key) {
            yield {
              state_llm_stream_data: {
                // @ts-expect-error TODO -- Fix this?
                key: state_key as TGraph extends
                  TGraphDef<any, any, any, infer K, any> ? K : never,
                chunk,
                meta,
              },
            };
            continue;
          }

          // Handle other stream keys
          const other_stream_keys = this.graphConfig.other_llm_stream_keys;
          const other_key = getStreamKeyFromMetaTags(
            other_stream_keys,
            meta.tags,
          );

          if (other_key) {
            yield {
              other_llm_stream_data: {
                key: other_key as TGraph extends
                  TGraphDef<any, any, any, infer K> ? K : never,
                chunk,
                meta,
              },
            };
          }
        }
      }
    } catch (e) {
      if (thread_id) {
        await this.updateThread(thread_id, {
          status: {
            status: "error",
            error: (e as Error).message,
          },
        });
        yield {
          status_change: {
            status: "error",
            error: (e as Error).message,
          },
        };
      }
      throw e;
    } finally {
      if (thread_id) {
        const currentThread = await this.getThread(thread_id);
        if (currentThread?.status.status !== "interrupted") {
          await this.updateThread(thread_id, {
            status: {
              status: "idle",
            },
          });
          yield {
            status_change: {
              status: "idle",
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
