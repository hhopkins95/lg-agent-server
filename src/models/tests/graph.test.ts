import { assertEquals, exists } from "assert";
import { expect } from "bun:test";
import { testGraph } from "@/lib/utils/getTestGraph.ts";
import { GRAPH_REGISTRY } from "@/models/registry.ts";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  it,
} from "jsr:@std/testing/bdd";
import { GraphManager } from "../graph.ts";

describe("GraphManager", () => {
  let manager: GraphManager<typeof testGraph>;

  beforeEach(async () => {
    await GRAPH_REGISTRY.registerGraph(testGraph);
    manager = GRAPH_REGISTRY.getManager(testGraph.graph_name);
  });

  afterEach(async () => {
    await GRAPH_REGISTRY.clear();
  });

  describe("initialization", () => {
    it("should initialize with valid configuration", () => {
      exists(manager);
      assertEquals(manager instanceof GraphManager, true);
    });

    it("should properly initialize assistant and thread managers", async () => {
      // Create an assistant
      const assistant = await manager.createAssistant({
        assistant_name: "test assistant",
        config: testGraph.default_config,
      });
      exists(assistant);

      // Create a thread
      const thread = await manager.createThread({
        assistant_id: assistant.id,
      });
      exists(thread);
    });
  });

  describe("execution", () => {
    it("should manage assistant and thread relationships correctly", async () => {
      // Create an assistant
      const assistant = await manager.createAssistant({
        assistant_name: "test assistant",
        config: testGraph.default_config,
      });

      // Create a thread linked to the assistant
      const thread = await manager.createThread({
        assistant_id: assistant.id,
      });

      assertEquals(thread.assistant_id, assistant.id);

      // Verify we can retrieve them
      const assistants = await manager.getAssistants();
      const threads = await manager.getThreads();

      assertEquals(assistants.length, 2);
      assertEquals(threads.length, 1);
    });

    it("should provide access to component managers", () => {
      const assistantManager = manager.getAssistantManager();
      const threadManager = manager.getThreadManager();

      exists(assistantManager);
      exists(threadManager);
    });
  });

  describe("graph execution", () => {
    it("should execute graph with existing assistant and thread", async () => {
      console.log("0");
      // Create assistant and thread
      const assistant = await manager.createAssistant({
        assistant_name: "test assistant",
        config: testGraph.default_config,
      });

      console.log("1a");
      const thread = await manager.createThread({
        assistant_id: assistant.id,
      });

      // Execute graph
      const initialState = { foo: 12 };
      console.log("1");
      const result = await manager.invokeGraph({
        assistantId: assistant.id,
        threadId: thread.id,
        state: initialState,
      });
      console.log("2");

      // Verify result
      exists(result);

      // Verify thread state was updated
      const updatedThread = await manager.getThreadManager().get(thread.id);
      assertEquals(updatedThread?.cur_state, result);
    });

    it("should execute graph with default assistant", async () => {
      // Create thread without assistant
      const thread = await manager.createThread();

      // Execute graph
      const initialState = { foo: 12 };
      const result = await manager.invokeGraph({
        threadId: thread.id,
        state: initialState,
      });

      // Verify result
      exists(result);

      // Verify thread state was updated
      const updatedThread = await manager.getThreadManager().get(thread.id);
      assertEquals(updatedThread?.cur_state, result);
    });

    it("should create new thread when shouldCreateThread is true", async () => {
      // Create assistant
      const assistant = await manager.createAssistant({
        assistant_name: "test assistant",
        config: testGraph.default_config,
      });

      // Execute graph with no thread
      const initialState = { foo: 12 };
      const result = await manager.invokeGraph({
        assistantId: assistant.id,
        shouldCreateThread: true,
        state: initialState,
      });

      // Verify result
      exists(result);

      // Verify a new thread was created with the result
      const threads = await manager.getThreads();
      assertEquals(threads.length, 1);
      assertEquals(threads[0].cur_state, result);
    });

    it("should use default state and config when not provided", async () => {
      // Create assistant and thread
      const assistant = await manager.createAssistant({
        assistant_name: "test assistant",
        config: testGraph.default_config,
      });

      const thread = await manager.createThread({
        assistant_id: assistant.id,
      });

      // Execute graph without state or config
      const result = await manager.invokeGraph({
        assistantId: assistant.id,
        threadId: thread.id,
      });

      // Verify result
      exists(result);

      // Verify thread state was updated
      const updatedThread = await manager.getThreadManager().get(thread.id);
      assertEquals(updatedThread?.cur_state, result);
    });
  });
});

describe("GraphRegistry", () => {
  beforeEach(async () => {
    await GRAPH_REGISTRY.registerGraph(testGraph);
  });

  afterEach(async () => {
    await GRAPH_REGISTRY.clear();
  });

  describe("manager management", () => {
    it("should register and retrieve managers correctly", () => {
      const manager = GRAPH_REGISTRY.getManager(testGraph.graph_name);
      exists(manager);
      assertEquals(manager instanceof GraphManager, true);
    });

    it("should maintain proper references between components", () => {
      const manager1 = GRAPH_REGISTRY.getManager(testGraph.graph_name);
      const manager2 = GRAPH_REGISTRY.getManager(testGraph.graph_name);

      // Should return the same instance
      assertEquals(manager1, manager2);
    });
  });
});
