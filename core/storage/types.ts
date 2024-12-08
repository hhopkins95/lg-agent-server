/**
 * Generic filter type for querying data stores
 * Supports basic comparison operators and metadata filtering
 */
export type DataStoreFilter<T> =
  & {
    [K in keyof T]?: T[K] | {
      $eq?: T[K];
      $ne?: T[K];
      $in?: T[K][];
      $exists?: boolean;
    };
  }
  & {
    metadata?: Record<string, unknown>;
  };

/**
 * Base interface for all data storage implementations
 * Provides CRUD operations and querying capabilities
 * @template T - The type of item being stored, must have an id field
 */
export interface DataStore<T extends { id: string }> {
  /**
   * Creates a new item in the store
   * @param item - The item to create
   * @returns The created item
   */
  create(item: T): Promise<T>;

  /**
   * Retrieves an item by its ID
   * @param id - The ID of the item to retrieve
   * @returns The item if found, undefined otherwise
   */
  get(id: string): Promise<T | undefined>;

  /**
   * Lists all items in the store
   * @returns Array of all items
   */
  list(): Promise<T[]>;

  /**
   * Updates an existing item
   * @param id - The ID of the item to update
   * @param updates - Partial updates to apply to the item
   * @returns The updated item if found, undefined otherwise
   */
  update(id: string, updates: Partial<T>): Promise<T | undefined>;

  /**
   * Deletes an item from the store
   * @param id - The ID of the item to delete
   * @returns true if the item was deleted, false if it didn't exist
   */
  delete(id: string): Promise<boolean>;

  /**
   * Retrieves multiple items by their IDs
   * @param ids - Array of item IDs to retrieve
   * @returns Array of found items (may be smaller than input array if some items don't exist)
   */
  batchGet(ids: string[]): Promise<T[]>;

  /**
   * Creates multiple items in the store
   * @param items - Array of items to create
   * @returns Array of created items
   */
  batchCreate(items: T[]): Promise<T[]>;

  /**
   * Queries items based on a filter
   * @param filter - Query filter to apply
   * @returns Array of matching items
   */
  query(filter: DataStoreFilter<T>): Promise<T[]>;

  /**
   * Optional initialization method
   * Called when the store is first created
   */
  initialize?(): Promise<void>;

  /**
   * Clears all items from the store
   * @returns A promise that resolves when all items have been cleared
   */
  clear(): Promise<void>;
}

/**
 * Extended interface for stores that support checkpointing
 * @template T - The type of item being stored
 */
export interface CheckpointStore<T extends { id: string }>
  extends DataStore<T> {
  /**
   * Creates a checkpoint for an item's state
   * @param id - The ID of the item to checkpoint
   * @param state - The state to checkpoint
   * @returns The ID of the created checkpoint
   */
  createCheckpoint(id: string, state: unknown): Promise<string>;

  /**
   * Retrieves a checkpoint's state
   * @param id - The ID of the item
   * @param checkpointId - The ID of the checkpoint to retrieve
   * @returns The checkpoint state if found
   */
  getCheckpoint(id: string, checkpointId: string): Promise<unknown>;
}

/**
 * Extended interface for stores that support streaming
 * @template T - The type of item being stored
 */
export interface StreamStore<T extends { id: string }> extends DataStore<T> {
  /**
   * Creates a new stream for an item
   * @param id - The ID of the item to create a stream for
   * @returns A readable stream
   */
  createStream(id: string): Promise<ReadableStream>;

  /**
   * Writes data to an item's stream
   * @param id - The ID of the item
   * @param chunk - The data to write to the stream
   */
  writeToStream(id: string, chunk: unknown): Promise<void>;
}
