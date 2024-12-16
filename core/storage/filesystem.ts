import fs from "node:fs/promises";
import path from "node:path";
import type { TAnnotation, TAssistant, TSavedThread } from "../types.ts";
import type { AppStorage, ThreadFilter } from "./types.ts";

/**
 * File system implementation of the AppStorage interface
 * Stores assistants and threads as JSON files in a directory structure
 */
export class FileSystemAppStorage<
  TConfig extends TAnnotation = TAnnotation,
  TState extends TAnnotation = TAnnotation,
> implements AppStorage<TConfig, TState> {
  private assistantsDir: string;
  private threadsDir: string;

  /**
   * Creates a new FileSystemAppStorage
   * @param baseDir - Base directory for storing files
   */
  constructor(baseDir: string) {
    this.assistantsDir = path.join(baseDir, "assistants");
    this.threadsDir = path.join(baseDir, "threads");
  }

  /**
   * Initializes the store by creating necessary directories
   */
  async initialize(): Promise<void> {
    await fs.mkdir(this.assistantsDir, { recursive: true });
    await fs.mkdir(this.threadsDir, { recursive: true });
  }

  /**
   * Clears all data from the store
   */
  async clear(): Promise<void> {
    await fs.rm(this.assistantsDir, { recursive: true, force: true });
    await fs.rm(this.threadsDir, { recursive: true, force: true });
    await this.initialize();
  }

  // Assistant operations
  async createAssistant(
    assistant: TAssistant<TConfig>,
  ): Promise<TAssistant<TConfig>> {
    const filePath = this.getAssistantPath(assistant.id);
    await fs.writeFile(filePath, JSON.stringify(assistant, null, 2));
    return assistant;
  }

  async getAssistant(id: string): Promise<TAssistant<TConfig> | undefined> {
    try {
      const filePath = this.getAssistantPath(id);
      const content = await fs.readFile(filePath, "utf-8");
      return JSON.parse(content) as TAssistant<TConfig>;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return undefined;
      }
      throw error;
    }
  }

  async listAssistants(): Promise<TAssistant<TConfig>[]> {
    const files = await fs.readdir(this.assistantsDir);
    const assistants: TAssistant<TConfig>[] = [];

    for (const file of files) {
      if (file.endsWith(".json")) {
        const content = await fs.readFile(
          path.join(this.assistantsDir, file),
          "utf-8",
        );
        assistants.push(JSON.parse(content) as TAssistant<TConfig>);
      }
    }

    return assistants;
  }

  async updateAssistant(
    id: string,
    updates: Partial<TAssistant<TConfig>>,
  ): Promise<TAssistant<TConfig> | undefined> {
    const existing = await this.getAssistant(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    const filePath = this.getAssistantPath(id);
    await fs.writeFile(filePath, JSON.stringify(updated, null, 2));
    return updated;
  }

  async deleteAssistant(id: string): Promise<boolean> {
    try {
      const filePath = this.getAssistantPath(id);
      await fs.unlink(filePath);

      // Update any threads that reference this assistant
      const threads = await this.listThreads({ assistant_id: id });
      await Promise.all(
        threads.map((thread) =>
          this.updateThread(thread.id, { assistant_id: undefined })
        ),
      );

      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return false;
      }
      throw error;
    }
  }

  // Thread operations
  async createThread(
    thread: TSavedThread<TState>,
  ): Promise<TSavedThread<TState>> {
    const filePath = this.getThreadPath(thread.id);
    await fs.writeFile(filePath, JSON.stringify(thread, null, 2));
    return thread;
  }

  async getThread(id: string): Promise<TSavedThread<TState> | undefined> {
    try {
      const filePath = this.getThreadPath(id);
      const content = await fs.readFile(filePath, "utf-8");
      return JSON.parse(content) as TSavedThread<TState>;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return undefined;
      }
      throw error;
    }
  }

  async listThreads(filter?: ThreadFilter): Promise<TSavedThread<TState>[]> {
    const files = await fs.readdir(this.threadsDir);
    const threads: TSavedThread<TState>[] = [];

    for (const file of files) {
      if (file.endsWith(".json")) {
        const content = await fs.readFile(
          path.join(this.threadsDir, file),
          "utf-8",
        );
        const thread = JSON.parse(content) as TSavedThread<TState>;

        // Apply filters
        if (filter) {
          if (
            filter.assistant_id !== undefined &&
            thread.assistant_id !== filter.assistant_id
          ) {
            continue;
          }
          if (filter.status !== undefined && thread.status !== filter.status) {
            continue;
          }
          if (
            filter.created_after !== undefined &&
            thread.created_at <= filter.created_after
          ) {
            continue;
          }
          if (
            filter.created_before !== undefined &&
            thread.created_at >= filter.created_before
          ) {
            continue;
          }
        }

        threads.push(thread);
      }
    }

    return threads;
  }

  async updateThread(
    id: string,
    updates: Partial<TSavedThread<TState>>,
  ): Promise<TSavedThread<TState> | undefined> {
    const existing = await this.getThread(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    const filePath = this.getThreadPath(id);
    await fs.writeFile(filePath, JSON.stringify(updated, null, 2));
    return updated;
  }

  async deleteThread(id: string): Promise<boolean> {
    try {
      const filePath = this.getThreadPath(id);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return false;
      }
      throw error;
    }
  }

  private getAssistantPath(id: string): string {
    return path.join(this.assistantsDir, `${id}.json`);
  }

  private getThreadPath(id: string): string {
    return path.join(this.threadsDir, `${id}.json`);
  }
}
