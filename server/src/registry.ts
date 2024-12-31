import { GraphManager } from "@agent-toolkit/core";
import type {
  AppStorage,
  TGraphSpecification,
} from "@agent-toolkit/core/types";
import { BaseCheckpointSaver } from "@langchain/langgraph";

/**
 * A singleton registry for managing all graph managers.
 * Responsible for creating and fetching graphs
 */
class GraphRegistry {
  private static instance: GraphRegistry;
  private GraphManagers: Map<string, GraphManager<any>>;

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
  public async registerGraphManager<TGraph extends TGraphSpecification>(
    graph: TGraph,
    appStorage?: AppStorage,
    checkpointer?: BaseCheckpointSaver,
  ) {
    if (this.GraphManagers.has(graph.name)) {
      throw new Error(`Graph manager for ${graph.name} already exists`);
    }

    const manager = new GraphManager(
      graph,
      appStorage,
      checkpointer,
    );

    await manager.initialize();
    this.GraphManagers.set(graph.name, manager);
  }

  /**
   * Get a graph manager by graph name
   * @param name The name of the graph
   * @returns The graph manager instance
   * @throws Error if the manager does not exist
   */
  public getManager(name: string): GraphManager<any> {
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
  public hasGraphManager(name: string): boolean {
    return this.GraphManagers.has(name);
  }

  /**
   * Get all registered graph managers
   */
  public getAllGraphManagers(): GraphManager<any>[] {
    return Array.from(this.GraphManagers.values());
  }

  /**
   * Clear all managers from the registry
   */
  public clear(): void {
    this.GraphManagers.clear();
  }
}

export const GRAPH_REGISTRY = GraphRegistry.getInstance();
