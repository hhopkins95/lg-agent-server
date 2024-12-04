import {
  Assistant,
  AssistantSchema,
  GraphServerConfiguration,
} from "../types.ts";
import { DataStore } from "./storage/index.ts";
import { z } from "zod";

/**
 * Manages assistants for a specific graph type
 * @template T - The specific graph type being managed
 */
export class AssistantManager<T extends GraphServerConfiguration> {
  /**
   * Creates a new AssistantManager
   * @param graphConfig - The graph this manager is associated with
   * @param store - The storage implementation to use
   */
  constructor(
    protected graphConfig: T,
    protected store: DataStore<Assistant>,
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

    const all_assistants: Assistant[] = [];

    if (this.graphConfig.default_config) {
      const config = this.graphConfig.default_config;
      all_assistants.push({
        id: "__DEFAULT__",
        assistant_name: "__DEFAULT__",
        description: `Default configuration for ${this.graphConfig.graph_name}`,
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
  async get(id: string): Promise<Assistant | undefined> {
    return await this.store.get(id);
  }

  /**
   * Get Default Assistant
   */
  async getDefaultAssistant(): Promise<Assistant | undefined> {
    return await this.store.get("__DEFAULT__");
  }

  /**
   * List all Assistants
   */
  async listAllAssistants(): Promise<Assistant[]> {
    return await this.store.list();
  }

  /**
   * Creates a new assistant
   * @param assistant - The assistant to create
   */
  async createAssistant(
    assistant: Assistant,
  ): Promise<Assistant<T["config_schema"]>> {
    // Validate against schema before storing
    AssistantSchema(this.graphConfig.config_schema).parse(assistant);
    return this.store.create(assistant);
  }

  /**
   * Updates an existing assistant
   * @param id - ID of the assistant to update
   * @param updates - Updates to apply
   */
  async updateAssistant(
    id: string,
    updates: Partial<Assistant>,
  ): Promise<Assistant | undefined> {
    const existing = await this.store.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    // Validate updated assistant
    AssistantSchema(this.graphConfig.config_schema).parse(updated);

    return this.store.update(id, updated);
  }
}
