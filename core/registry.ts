import { Assistant, GraphServerConfiguration, Thread } from "../types.ts";
import { GraphStateManager } from "./graph.ts";
import { FileSystemStore } from "./storage/filesystem.ts";
import { InMemoryStore } from "./storage/index.ts";
import { DataStore } from "./storage/types.ts";

/**
 * A singleton registry for managing all graph managers.
 * Responsible for creating and fetching graphs
 */
class GraphRegistry {
  private static instance: GraphRegistry;
  private GraphManagers: Map<string, GraphStateManager<any>>;

  private constructor() {
    this.GraphManagers = new Map();
  }

  /**
   * Get the singleton instance of the GraphRegistry
   */
  public static getInstance(): GraphRegistry {
    if (!GraphRegistry.instance) {
      GraphRegistry.instance = new GraphRegistry();
    }
    return GraphRegistry.instance;
  }

  /**
   * Register a new graph manager in the registry
   * @param graph The graph specification
   * @param dataPath Optional data path for storage -- if provided, will use a file store
   * @throws Error if a manager for this graph already exists
   */
  public async registerGraph(
    graph: GraphServerConfiguration,
    dataPath?: string,
  ) {
    if (this.GraphManagers.has(graph.graph_name)) {
      throw new Error(`Graph manager for ${graph.graph_name} already exists`);
    }

    let assistantStore: DataStore<Assistant<typeof graph["config_schema"]>>;
    let threadStore: DataStore<Thread<typeof graph["state_schema"]>>;

    if (dataPath) {
      // Create filesystem stores with Zod schema validation
      assistantStore = new FileSystemStore<
        Assistant<typeof graph["config_schema"]>
      >(
        `${dataPath}/assistants`,
      );

      threadStore = new FileSystemStore<Thread<typeof graph["state_schema"]>>(
        `${dataPath}/threads`,
      );
    } else {
      // Create in-memory stores (validation handled by managers)
      assistantStore = new InMemoryStore<
        Assistant<typeof graph["config_schema"]>
      >();
      threadStore = new InMemoryStore<Thread<typeof graph["state_schema"]>>();
    }

    const manager = new GraphStateManager({
      graphConfig: graph,
      assistantStore,
      threadStore,
    });
    await manager.initialize();
    this.GraphManagers.set(graph.graph_name, manager);
  }

  /**
   * Get a graph manager by graph name
   * @param name The name of the graph
   * @returns The graph manager instance
   * @throws Error if the manager does not exist
   */
  public getManager(name: string): GraphStateManager<any> {
    const manager = this.GraphManagers.get(name);
    if (!manager) {
      throw new Error(`Graph manager for ${name} not found`);
    }
    return manager;
  }

  /**
   * Check if a graph manager exists in the registry
   * @param name The name of the graph to check
   */
  public hasManager(name: string): boolean {
    return this.GraphManagers.has(name);
  }

  /**
   * Get all registered graph managers
   */
  public getAllManagers(): GraphStateManager<any>[] {
    return Array.from(this.GraphManagers.values());
  }

  /**
   * Clear all managers from the registry
   */
  public clear(): void {
    this.GraphManagers.clear();
  }

  /**
   * Get the assistant manager for a specific graph
   * @param graphName The name of the graph to get the assistant manager for
   * @returns The assistant manager instance
   * @throws Error if the graph manager does not exist
   */
  public getGraphAssistantManager(graphName: string) {
    return this.getManager(graphName).getAssistantManager();
  }

  /**
   * Get the thread manager for a specific graph
   * @param graphName The name of the graph to get the thread manager for
   * @returns The thread manager instance
   * @throws Error if the graph manager does not exist
   */
  public getGraphThreadManager(graphName: string) {
    return this.getManager(graphName).getThreadManager();
  }
}

export const GRAPH_REGISTRY = GraphRegistry.getInstance();
