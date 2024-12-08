import { InMemoryStore } from "@/core/storage/memory";
import type { TAssistant, TThread } from "@/core/types";
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { GraphStateManager } from "../graph";

import { GraphDefinition } from "@/__example-agents__/reAct/graph";

const TestGraphDef = GraphDefinition;

describe("GraphStateManager", () => {
  let graphManager: GraphStateManager<typeof TestGraphDef>;
  let assistantStore: InMemoryStore<
    TAssistant<typeof TestGraphDef["config_annotation"]>
  >;
  let threadStore: InMemoryStore<
    TThread<typeof TestGraphDef["state_annotation"]>
  >;

  beforeEach(() => {
    // Initialize stores and graph manager
    assistantStore = new InMemoryStore();
    threadStore = new InMemoryStore();
    graphManager = new GraphStateManager(
      TestGraphDef,
      assistantStore,
      threadStore,
    );
  });

  afterEach(async () => {
    // Clean up stores
    await assistantStore.clear();
    await threadStore.clear();
  });

  describe("basic operations", () => {
    it("should create an assistant", async () => {
      // Create assistant with test config
      const assistant = await graphManager.createAssistant({
        assistant_name: "test assistant",
        config: TestGraphDef.default_config!,
      });
      // Verify assistant was created with correct properties
      expect(assistant).toBeDefined();
      expect(assistant.name).toBe("test assistant");
    });

    it("should create a thread", async () => {
      // Create thread
      const assistant = await graphManager.createAssistant({
        assistant_name: "test assistant",
        config: TestGraphDef.default_config,
      });
      const thread = await graphManager.createThread({
        assistant_id: assistant.id,
      });
      // Verify thread was created with correct properties
      expect(thread).toBeDefined();
      expect(thread.assistant_id).toBe(assistant.id);
    });

    it("should get all assistants", async () => {
      // Create multiple assistants
      await graphManager.createAssistant({
        assistant_name: "assistant1",
        config: TestGraphDef.default_config,
      });
      await graphManager.createAssistant({
        assistant_name: "assistant2",
        config: TestGraphDef.default_config,
      });
      // Verify getAssistants returns correct list
      const assistants = await graphManager.getAssistants();
      expect(assistants.length).toBe(2);
    });

    it("should get all threads", async () => {
      // Create multiple threads
      const assistant = await graphManager.createAssistant({
        assistant_name: "test assistant",
        config: TestGraphDef.default_config,
      });
      await graphManager.createThread({
        assistant_id: assistant.id,
      });
      await graphManager.createThread({
        assistant_id: assistant.id,
      });
      // Verify getThreads returns correct list
      const threads = await graphManager.getThreads();
      expect(threads.length).toBe(2);
    });
  });

  describe("graph execution", () => {
    let testAssistant: TAssistant<typeof TestGraphDef["config_annotation"]>;
    let testThread: TThread<typeof TestGraphDef["state_annotation"]>;

    beforeEach(async () => {
      // Create test assistant and thread for execution tests
      testAssistant = await graphManager.createAssistant({
        assistant_name: "test assistant",
        config: TestGraphDef.default_config,
      });
      testThread = await graphManager.createThread({
        assistant_id: testAssistant.id,
      });
    });

    it("should invoke graph with existing assistant and thread", async () => {
      // Test invokeGraph with existing assistant/thread
      const initialState = { messages: [], count: 0 };
      const result = await graphManager.runGraph(testThread.id, initialState);
      // Verify state updates correctly
      expect(result).toBeDefined();
      expect(result.count).toBe(1);
      expect(Array.isArray(result.messages)).toBe(true);
    });

    it("should invoke graph with new thread creation", async () => {
      // Test invokeGraph with shouldCreateThread=true
      const initialState = { messages: [], count: 0 };
      const result = await graphManager.runGraph(
        testThread.id,
        initialState,
        true,
      );
      // Verify new thread created and state updated
      expect(result).toBeDefined();
      expect(result.count).toBe(1);
      expect(Array.isArray(result.messages)).toBe(true);
    });

    it("should stream graph execution", async () => {
      // Test streamGraph
      const initialState = { messages: [], count: 0 };
      const stream = graphManager.streamGraph(testThread.id, initialState);
      // Verify stream yields correct updates
      const updates = [];
      for await (const update of stream) {
        updates.push(update);
      }
      expect(updates.length).toBeGreaterThan(0);
    });
  });

  describe("error handling", () => {
    it("should handle invalid assistant ID", async () => {
      // Test behavior with non-existent assistant ID
      await expect(graphManager.getAssistantManager().get("invalid-id")).rejects
        .toThrow();
    });

    it("should handle invalid thread ID", async () => {
      // Test behavior with non-existent thread ID
      await expect(graphManager.getThreadManager().get("invalid-id")).rejects
        .toThrow();
    });

    it("should handle invalid graph state", async () => {
      // Test behavior with invalid state input
      const thread = await graphManager.createThread({
        assistant_id: (await graphManager.createAssistant({
          assistant_name: "test",
          config: TestGraphDef.default_config,
        })).id,
      });
      const invalidState = { invalid: "state" };
      await expect(graphManager.runGraph(thread.id, invalidState as any))
        .rejects.toThrow();
    });
  });
});
