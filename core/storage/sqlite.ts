import { Database } from "bun:sqlite";
import type { TAnnotation, TAssistant, TThread } from "../types.ts";
import type { AppStorage, ThreadFilter } from "./app-storage.ts";

/**
 * SQLite implementation of AppStorage
 */
export class SQLiteAppStorage<
    TConfig extends TAnnotation = TAnnotation,
    TState extends TAnnotation = TAnnotation,
> implements AppStorage<TConfig, TState> {
    private db: Database;

    constructor(dbPath: string) {
        this.db = new Database(dbPath);
    }

    async initialize(): Promise<void> {
        // Create assistants table
        await this.db.exec(`
      CREATE TABLE IF NOT EXISTS assistants (
        id TEXT PRIMARY KEY,
        graph_name TEXT NOT NULL,
        description TEXT,
        metadata TEXT,
        config TEXT NOT NULL
      )
    `);

        // Create threads table
        await this.db.exec(`
      CREATE TABLE IF NOT EXISTS threads (
        id TEXT PRIMARY KEY,
        assistant_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('idle', 'busy', 'interrupted', 'error')),
        values TEXT,
        FOREIGN KEY(assistant_id) REFERENCES assistants(id)
      )
    `);
    }

    async clear(): Promise<void> {
        this.db.run("DELETE FROM threads");
        this.db.run("DELETE FROM assistants");
    }

    // Assistant operations
    async createAssistant(
        assistant: TAssistant<TConfig>,
    ): Promise<TAssistant<TConfig>> {
        const stmt = this.db.prepare(`
      INSERT INTO assistants (id, graph_name, description, metadata, config)
      VALUES ($id, $graph_name, $description, $metadata, $config)
    `);

        stmt.run({
            $id: assistant.id,
            $graph_name: assistant.graph_name,
            $description: assistant.description || null,
            $metadata: assistant.metadata
                ? JSON.stringify(assistant.metadata)
                : null,
            $config: JSON.stringify(assistant.config),
        });

        return assistant;
    }

    async getAssistant(id: string): Promise<TAssistant<TConfig> | undefined> {
        const row = this.db.prepare(`
      SELECT * FROM assistants WHERE id = $id
    `).get({ $id: id }) as any;

        if (!row) return undefined;

        return {
            id: row.id,
            graph_name: row.graph_name,
            description: row.description,
            metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
            config: JSON.parse(row.config),
        };
    }

    async listAssistants(): Promise<TAssistant<TConfig>[]> {
        const rows = this.db.prepare("SELECT * FROM assistants").all() as any[];

        return rows.map((row) => ({
            id: row.id,
            graph_name: row.graph_name,
            description: row.description,
            metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
            config: JSON.parse(row.config),
        }));
    }

    async updateAssistant(
        id: string,
        updates: Partial<TAssistant<TConfig>>,
    ): Promise<TAssistant<TConfig> | undefined> {
        const current = await this.getAssistant(id);
        if (!current) return undefined;

        const updated = { ...current, ...updates };
        const stmt = this.db.prepare(`
      UPDATE assistants 
      SET graph_name = $graph_name,
          description = $description,
          metadata = $metadata,
          config = $config
      WHERE id = $id
    `);

        stmt.run({
            $id: id,
            $graph_name: updated.graph_name,
            $description: updated.description || null,
            $metadata: updated.metadata
                ? JSON.stringify(updated.metadata)
                : null,
            $config: JSON.stringify(updated.config),
        });

        return updated;
    }

    async deleteAssistant(id: string): Promise<boolean> {
        const result = this.db.prepare("DELETE FROM assistants WHERE id = ?")
            .run(id);
        return result.changes > 0;
    }

    // Thread operations
    async createThread(thread: TThread<TState>): Promise<TThread<TState>> {
        const stmt = this.db.prepare(`
      INSERT INTO threads (id, assistant_id, created_at, updated_at, status, values)
      VALUES ($id, $assistant_id, $created_at, $updated_at, $status, $values)
    `);

        stmt.run({
            $id: thread.id,
            $assistant_id: thread.assistant_id || null,
            $created_at: thread.created_at,
            $updated_at: thread.updated_at,
            $status: thread.status,
            $values: thread.values ? JSON.stringify(thread.values) : null,
        });

        return thread;
    }

    async getThread(id: string): Promise<TThread<TState> | undefined> {
        const row = this.db.prepare(`
      SELECT * FROM threads WHERE id = $id
    `).get({ $id: id }) as any;

        if (!row) return undefined;

        return {
            id: row.id,
            assistant_id: row.assistant_id,
            created_at: row.created_at,
            updated_at: row.updated_at,
            status: row.status,
            values: row.values ? JSON.parse(row.values) : undefined,
        };
    }

    async listThreads(filter?: ThreadFilter): Promise<TThread<TState>[]> {
        let query = "SELECT * FROM threads";
        const params: any = {};
        const conditions: string[] = [];

        if (filter) {
            if (filter.assistant_id) {
                conditions.push("assistant_id = $assistant_id");
                params.$assistant_id = filter.assistant_id;
            }
            if (filter.status) {
                conditions.push("status = $status");
                params.$status = filter.status;
            }
            if (filter.created_after) {
                conditions.push("created_at > $created_after");
                params.$created_after = filter.created_after;
            }
            if (filter.created_before) {
                conditions.push("created_at < $created_before");
                params.$created_before = filter.created_before;
            }
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        const rows = this.db.prepare(query).all(params) as any[];

        return rows.map((row) => ({
            id: row.id,
            assistant_id: row.assistant_id,
            created_at: row.created_at,
            updated_at: row.updated_at,
            status: row.status,
            values: row.values ? JSON.parse(row.values) : undefined,
        }));
    }

    async updateThread(
        id: string,
        updates: Partial<TThread<TState>>,
    ): Promise<TThread<TState> | undefined> {
        const current = await this.getThread(id);
        if (!current) return undefined;

        const updated = { ...current, ...updates };
        const stmt = this.db.prepare(`
      UPDATE threads 
      SET assistant_id = $assistant_id,
          updated_at = $updated_at,
          status = $status,
          values = $values
      WHERE id = $id
    `);

        stmt.run({
            $id: id,
            $assistant_id: updated.assistant_id || null,
            $updated_at: updated.updated_at,
            $status: updated.status,
            $values: updated.values ? JSON.stringify(updated.values) : null,
        });

        return updated;
    }

    async deleteThread(id: string): Promise<boolean> {
        const result = this.db.prepare("DELETE FROM threads WHERE id = ?").run(
            id,
        );
        return result.changes > 0;
    }
}
