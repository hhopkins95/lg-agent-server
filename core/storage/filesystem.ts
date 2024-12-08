import fs from "node:fs/promises";
import path from "node:path";
import type { CheckpointStore, DataStore, DataStoreFilter } from "./types.ts";

/**
 * File system implementation of the DataStore interface
 * Stores items as JSON files in a directory structure
 * @template T - The type of item being stored
 */
export class FileSystemStore<T extends { id: string }>
  implements CheckpointStore<T> {
  /**
   * Creates a new FileSystemStore
   * @param dataDir - Base directory for storing files
   * @param validator - Function to validate items before storage
   */
  constructor(
    protected dataDir: string,
  ) {}

  /**
   * Initializes the store by creating necessary directories
   */
  async initialize(): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });
    await fs.mkdir(path.join(this.dataDir, "checkpoints"), { recursive: true });
  }

  /**
   * Creates a new item
   * @param item - The item to create
   */
  async create(item: T): Promise<T> {
    const filePath = this.getFilePath(item.id);
    await fs.writeFile(filePath, JSON.stringify(item, null, 2));
    return item;
  }

  /**
   * Retrieves an item by ID
   * @param id - The ID of the item to retrieve
   */
  async get(id: string): Promise<T | undefined> {
    try {
      const filePath = this.getFilePath(id);
      const content = await fs.readFile(filePath, "utf-8");
      const item = JSON.parse(content) as T;
      return item;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return undefined;
      }
      throw error;
    }
  }

  /**
   * Lists all items in the store
   */
  async list(): Promise<T[]> {
    const files = await fs.readdir(this.dataDir);
    const items: T[] = [];

    for (const file of files) {
      if (file.endsWith(".json")) {
        const content = await fs.readFile(
          path.join(this.dataDir, file),
          "utf-8",
        );
        items.push(JSON.parse(content) as T);
      }
    }

    return items;
  }

  /**
   * Updates an existing item
   * @param id - The ID of the item to update
   * @param updates - The updates to apply
   */
  async update(id: string, updates: Partial<T>): Promise<T | undefined> {
    const existing = await this.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates } as T;

    const filePath = this.getFilePath(id);
    await fs.writeFile(filePath, JSON.stringify(updated, null, 2));
    return updated;
  }

  /**
   * Deletes an item
   * @param id - The ID of the item to delete
   */
  async delete(id: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(id);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return false;
      }
      throw error;
    }
  }

  /**
   * Retrieves multiple items by their IDs
   * @param ids - The IDs of the items to retrieve
   */
  async batchGet(ids: string[]): Promise<T[]> {
    const items = await Promise.all(
      ids.map(async (id) => this.get(id)),
    );
    // @ts-ignore TODO -- FIX
    return items.filter((item): item is T => item !== undefined);
  }

  /**
   * Creates multiple items
   * @param items - The items to create
   */
  async batchCreate(items: T[]): Promise<T[]> {
    return Promise.all(items.map((item) => this.create(item)));
  }

  /**
   * Queries items based on a filter
   * @param filter - The filter to apply
   */
  async query(filter: DataStoreFilter<T>): Promise<T[]> {
    const items = await this.list();
    return items.filter((item) => this.matchesFilter(item, filter));
  }

  /**
   * Creates a checkpoint for an item
   * @param id - The ID of the item
   * @param state - The state to checkpoint
   */
  async createCheckpoint(id: string, state: unknown): Promise<string> {
    const checkpointId = `${id}_${Date.now()}`;
    const checkpointPath = this.getCheckpointPath(id, checkpointId);

    await fs.mkdir(path.dirname(checkpointPath), { recursive: true });
    await fs.writeFile(checkpointPath, JSON.stringify(state, null, 2));

    return checkpointId;
  }

  /**
   * Retrieves a checkpoint
   * @param id - The ID of the item
   * @param checkpointId - The ID of the checkpoint
   */
  async getCheckpoint(id: string, checkpointId: string): Promise<unknown> {
    const checkpointPath = this.getCheckpointPath(id, checkpointId);
    const content = await fs.readFile(checkpointPath, "utf-8");
    return JSON.parse(content);
  }

  /**
   * Gets the file path for an item
   * @private
   */
  private getFilePath(id: string): string {
    return path.join(this.dataDir, `${id}.json`);
  }

  /**
   * Gets the file path for a checkpoint
   * @private
   */
  private getCheckpointPath(id: string, checkpointId: string): string {
    return path.join(this.dataDir, "checkpoints", id, `${checkpointId}.json`);
  }

  /**
   * Checks if an item matches a filter
   * @private
   */
  private matchesFilter(item: T, filter: DataStoreFilter<T>): boolean {
    for (const [key, value] of Object.entries(filter)) {
      if (key === "metadata") {
        if (!this.matchesMetadata(item, value as Record<string, unknown>)) {
          return false;
        }
        continue;
      }

      const itemValue = item[key as keyof T];

      if (typeof value === "object" && value !== null) {
        const ops = value as {
          $eq?: unknown;
          $ne?: unknown;
          $in?: unknown[];
          $exists?: boolean;
        };

        if (
          ops.$exists !== undefined && (itemValue === undefined) === ops.$exists
        ) {
          return false;
        }
        if (ops.$eq !== undefined && itemValue !== ops.$eq) {
          return false;
        }
        if (ops.$ne !== undefined && itemValue === ops.$ne) {
          return false;
        }
        if (ops.$in !== undefined && !ops.$in.includes(itemValue)) {
          return false;
        }
      } else if (itemValue !== value) {
        return false;
      }
    }

    return true;
  }

  /**
   * Checks if an item's metadata matches a filter
   * @private
   */
  private matchesMetadata(
    item: T,
    metadata: Record<string, unknown>,
  ): boolean {
    const itemMetadata =
      (item as unknown as { metadata?: Record<string, unknown> }).metadata;
    if (!itemMetadata) return false;

    for (const [key, value] of Object.entries(metadata)) {
      if (itemMetadata[key] !== value) {
        return false;
      }
    }

    return true;
  }
}
