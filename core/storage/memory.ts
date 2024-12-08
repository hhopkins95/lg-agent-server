import type { DataStore, DataStoreFilter } from "./types.ts";

/**
 * In-memory implementation of the DataStore interface
 * Useful for testing and development
 * @template T - The type of item being stored
 */
export class InMemoryStore<T extends { id: string }> implements DataStore<T> {
  protected items: Map<string, T>;

  /**
   * Creates a new InMemoryStore
   * @param validator - Optional function to validate items
   */
  constructor(protected validator?: (item: T) => void) {
    this.items = new Map();
  }

  /**
   * Creates a new item in memory
   * @param item - The item to create
   */
  async create(item: T): Promise<T> {
    this.validator?.(item);
    this.items.set(item.id, { ...item });
    return item;
  }

  /**
   * Retrieves an item from memory
   * @param id - The ID of the item to retrieve
   */
  async get(id: string): Promise<T | undefined> {
    return this.items.get(id);
  }

  /**
   * Lists all items in memory
   */
  async list(): Promise<T[]> {
    return Array.from(this.items.values());
  }

  /**
   * Updates an item in memory
   * @param id - The ID of the item to update
   * @param updates - The updates to apply
   */
  async update(id: string, updates: Partial<T>): Promise<T | undefined> {
    const existing = this.items.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates } as T;
    this.validator?.(updated);
    this.items.set(id, updated);
    return updated;
  }

  /**
   * Deletes an item from memory
   * @param id - The ID of the item to delete
   */
  async delete(id: string): Promise<boolean> {
    return this.items.delete(id);
  }

  /**
   * Retrieves multiple items from memory
   * @param ids - The IDs of the items to retrieve
   */
  async batchGet(ids: string[]): Promise<T[]> {
    return ids
      .map((id) => this.items.get(id))
      .filter((item): item is T => item !== undefined);
  }

  /**
   * Creates multiple items in memory
   * @param items - The items to create
   */
  async batchCreate(items: T[]): Promise<T[]> {
    return Promise.all(items.map((item) => this.create(item)));
  }

  /**
   * Queries items in memory based on a filter
   * @param filter - The filter to apply
   */
  async query(filter: DataStoreFilter<T>): Promise<T[]> {
    return Array.from(this.items.values()).filter((item) =>
      this.matchesFilter(item, filter)
    );
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
