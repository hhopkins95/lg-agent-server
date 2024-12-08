import { InMemoryStore } from "@/core/storage/memory";
import type { TAssistant, TThread } from "@/core/types";
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { GraphStateManager } from "../graph";

import { GraphDefinition } from "@/__example-agents__/reAct/graph";

const TestGraphDef = GraphDefinition;

describe("GraphManager", () => {
  let graphManager: GraphStateManager<typeof TestGraphDef>;
  let assistantStore: InMemoryStore<
    TAssistant<typeof TestGraphDef["config_annotation"]>
  >;
  let threadStore: InMemoryStore<
    TThread<typeof TestGraphDef["state_annotation"]>
  >;

  beforeEach(() => {
    assistantStore = new InMemoryStore();
    threadStore = new InMemoryStore();
    graphManager = new GraphStateManager(
      TestGraphDef,
      assistantStore,
      threadStore,
    );
  });

  afterEach(async () => {
    await assistantStore.();
    await threadStore.clear();
  });

  describe("initialization", () => {
    /**
     * Tests basic initialization of the GraphManager
     * Verifies that the manager is properly instantiated
     */
    it("should initialize with valid configuration", () => {
      expect(graphManager).toBeDefined();
      expect(graphManager instanceof GraphManager).toBe(true);
    });

    /**
     * Tests that stores are properly accessible after initialization
     */
    it("should provide access to stores", () => {
      expect(graphManager.assistantStore).toBeDefined();
      expect(graphManager.threadStore).toBeDefined();
    });
  });

  describe("assistant management", () => {
    /**
     * Tests assistant creation and retrieval functionality
     * Verifies that assistants can be created and later retrieved by ID
     */
    it("should create and retrieve assistants", async () => {
      const assistant = await graphManager.createAssistant({
        assistant_name: "test assistant",
        config: TestGraphDef.default_config,
      });



      expect(assistant).toBeDefined();
      expect(assistant.name).toBe("test assistant");

      const retrievedAssistant = await graphManager.getAssistant(assistant.id);
      expect(retrievedAssistant).toEqual(assistant);
    });

    /**
     * Tests the listing of all assistants
     * Verifies that multiple assistants can be created and retrieved
     */
    it("should list all assistants", async () => {
      await graphManager.createAssistant({
        assistant_name: "assistant1",
        config: TestGraphDef.default_config,
      });
      await graphManager.createAssistant({
        assistant_name: "assistant2",
        config: TestGraphDef.default_config,
      });

      const assistants = await graphManager.getAssistants();
      expect(assistants.length).toBe(2);
    });

    /**
     * Tests assistant deletion functionality
     * Verifies that assistants can be properly removed from the store
     */
    it("should delete assistants", async () => {
      const assistant = await graphManager.createAssistant({
        assistant_name: "test assistant",
        config: TestGraphDef.default_config,
      });

      await graphManager.deleteAssistant(assistant.id);
      const assistants = await graphManager.getAssistants();
      expect(assistants.length).toBe(0);
    });
  });

  describe("thread management", () => {
    let testAssistant: TAssistant<typeof TestGraphDef["config_annotation"]>;

    beforeEach(async () => {
      testAssistant = await graphManager.createAssistant({
        assistant_name: "test assistant",
        config: TestGraphDef.default_config,
      });
    });

    /**
     * Tests thread creation and retrieval functionality
     * Verifies that threads can be created and later retrieved by ID
     */
    it("should create and retrieve threads", async () => {
      const thread = await graphManager.createThread({
        assistant_id: testAssistant.id,
      });

      expect(thread).toBeDefined();
      expect(thread.assistant_id).toBe(testAssistant.id);

      const retrievedThread = await graphManager.getThread(thread.id);
      expect(retrievedThread).toEqual(thread);
    });

    /**
     * Tests the listing of all threads
     * Verifies that multiple threads can be created and retrieved
     */
    it("should list all threads", async () => {
      await graphManager.createThread({ assistant_id: testAssistant.id });
      await graphManager.createThread({ assistant_id: testAssistant.id });

      const threads = await graphManager.getThreads();
      expect(threads.length).toBe(2);
    });

    /**
     * Tests thread deletion functionality
     * Verifies that threads can be properly removed from the store
     */
    it("should delete threads", async () => {
      const thread = await graphManager.createThread({
        assistant_id: testAssistant.id,
      });

      await graphManager.deleteThread(thread.id);
      const threads = await graphManager.getThreads();
      expect(threads.length).toBe(0);
    });
  });

  describe("graph execution", () => {
    let testAssistant: TAssistant<typeof TestGraphDef["config_annotation"]>;
    let testThread: TThread<typeof TestGraphDef["state_annotation"]>;

    beforeEach(async () => {
      testAssistant = await graphManager.createAssistant({
        assistant_name: "test assistant",
        config: TestGraphDef.default_config,
      });
      testThread = await graphManager.createThread({
        assistant_id: testAssistant.id,
      });
    });

    /**
     * Tests basic graph execution with initial state
     * Verifies that the graph properly processes the state and returns expected results
     */
    it("should execute graph with initial state", async () => {
      const initialState = { messages: [], count: 0 };
      const result = await graphManager.runGraph(testThread.id, initialState);

      expect(result).toBeDefined();
      expect(result.count).toBe(1);
      expect(Array.isArray(result.messages)).toBe(true);
    });

    /**
     * Tests state persistence between multiple graph executions
     * Verifies that the state is properly maintained and updated across runs
     */
    it("should maintain state between executions", async () => {
      const initialState = { messages: [], count: 0 };
      const result1 = await graphManager.runGraph(testThread.id, initialState);
      const result2 = await graphManager.runGraph(testThread.id, result1);

      expect(result2.count).toBe(2);
    });
  });

  describe("error handling", () => {
    /**
     * Tests error handling for invalid assistant IDs
     * Verifies that appropriate errors are thrown when accessing non-existent assistants
     */
    it("should handle invalid assistant IDs", async () => {
      await expect(graphManager.getAssistant("invalid-id")).rejects.toThrow();
    });

    /**
     * Tests error handling for invalid thread IDs
     * Verifies that appropriate errors are thrown when accessing non-existent threads
     */
    it("should handle invalid thread IDs", async () => {
      await expect(graphManager.getThread("invalid-id")).rejects.toThrow();
    });

    /**
     * Tests error handling for invalid graph states
     * Verifies that appropriate errors are thrown when executing graph with invalid state
     */
    it("should handle invalid states in graph execution", async () => {
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
