import type { TAnnotation } from "@/utils/type-helpers.ts";
import type { TAssistant, TGraphDef } from "./types.ts";
import type { DataStore } from "./storage/index.ts";

/**
 * Manages assistants for a specific graph type
 * @template TConfig - The configuration type annotation
 */
export class AssistantManager<TConfig extends TAnnotation> {
  /**
   * Creates a new AssistantManager
   * @param graphConfig - The graph this manager is associated with
   * @param store - The storage implementation to use
   */
  constructor(
    protected graphConfig: TGraphDef<any, any, any, TConfig>,
    protected store: DataStore<TAssistant<TConfig>>,
  ) {
  }

  async initialize(): Promise<void> {
    this.store.initialize && await this.store.initialize(); // Optional init method
    await this.loadAssistantsFromConfig();
  }

  /**
   * Loads / creates the assistants from the graph config
   *
   * If an assistant already exists in the store,
   * Will not overwrite existing assistants unless `should_upsert` is true (this means they have been manually edited)
   */
  protected async loadAssistantsFromConfig() {
    const should_upsert = false; // TODO -- pass this in through config

    const all_assistants: TAssistant<TConfig>[] = [];

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
      // get the current assistant from the store
      const existing = await this.store.get(assistant.id);

      // if doesn't exist, create it
      if (!existing) {
        await this.createAssistant(assistant);
        continue;
      }

      if (should_upsert) {
        // if exists, update it
        await this.updateAssistant(assistant.id, assistant);
        continue;
      }
    }
  }

  /**
   * Gets an assistant by ID
   */
  async get(id: string): Promise<TAssistant<TConfig> | undefined> {
    return await this.store.get(id);
  }

  /**
   * Get Default Assistant
   */
  async getDefaultAssistant(): Promise<TAssistant<TConfig> | undefined> {
    return await this.store.get("__DEFAULT__");
  }

  /**
   * List all Assistants
   */
  async listAllAssistants(): Promise<TAssistant<TConfig>[]> {
    return await this.store.list();
  }

  /**
   * Creates a new assistant
   * @param assistant - The assistant to create
   */
  async createAssistant(
    assistant: TAssistant<TConfig>,
  ): Promise<TAssistant<TConfig>> {
    return this.store.create(assistant);
  }

  /**
   * Updates an existing assistant
   * @param id - ID of the assistant to update
   * @param updates - Updates to apply
   */
  async updateAssistant(
    id: string,
    updates: Partial<TAssistant<TConfig>>,
  ): Promise<TAssistant<TConfig> | undefined> {
    const existing = await this.store.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    return this.store.update(id, updated);
  }
}
