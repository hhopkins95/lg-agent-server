// import { assertEquals, exists } from "assert";
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "bun:test";
import { testGraph } from "@/lib/utils/getTestGraph.ts";
import { GRAPH_REGISTRY } from "@/models/registry.ts";
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
      expect(manager).toBeDefined();
      // exists(manager);
      expect(manager instanceof GraphManager).toBe(true);
      // assertEquals(manager instanceof GraphManager, true);
    });

    it("should properly initialize assistant and thread managers", async () => {
      // Create an assistant
      const assistant = await manager.createAssistant({
        assistant_name: "test assistant",
        config: testGraph.default_config,
      });
      expect(assistant).toBeDefined();
      // exists(assistant);

      // Create a thread
      const thread = await manager.createThread({
        assistant_id: assistant.id,
      });
      expect(thread).toBeDefined();
      // exists(thread);
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

      // assertEquals(thread.assistant_id, assistant.id);
      expect(thread.assistant_id).toBe(assistant.id);

      // Verify we can retrieve them
      const assistants = await manager.getAssistants();
      const threads = await manager.getThreads();

      expect(assistants.length).toBe(2);
      expect(threads.length).toBe(1);
    });

    it("should provide access to component managers", () => {
      const assistantManager = manager.getAssistantManager();
      const threadManager = manager.getThreadManager();

      expect(assistantManager).toBeDefined();
      expect(threadManager).toBeDefined();
    });
  });

  describe("graph execution", () => {
    const initialState = { foo: 12, messages: [] };

    it("should execute graph with existing assistant and thread", async () => {
      // Create assistant and thread
      const assistant = await manager.createAssistant({
        assistant_name: "test assistant",
        config: testGraph.default_config,
      });

      const thread = await manager.createThread({
        assistant_id: assistant.id,
      });

      // Execute graph
      const result = await manager.invokeGraph({
        assistantId: assistant.id,
        threadId: thread.id,
        state: initialState,
      });

      // Verify result
      expect(result).toBeDefined();

      // Verify thread state was updated
      const updatedThread = await manager.getThreadManager().get(thread.id);
      expect(updatedThread?.cur_state).toBe(result);
    });

    it("should execute graph with default assistant", async () => {
      // Create thread without assistant
      const thread = await manager.createThread();

      // Execute graph
      const result = await manager.invokeGraph({
        threadId: thread.id,
        state: initialState,
      });

      // Verify result
      expect(result).toBeDefined();

      // Verify thread state was updated
      const updatedThread = await manager.getThreadManager().get(thread.id);
      expect(updatedThread?.cur_state).toBe(result);
    });

    it("should create new thread when shouldCreateThread is true", async () => {
      // Create assistant
      const assistant = await manager.createAssistant({
        assistant_name: "test assistant",
        config: testGraph.default_config,
      });

      // Execute graph with no thread
      const result = await manager.invokeGraph({
        assistantId: assistant.id,
        shouldCreateThread: true,
        state: initialState,
      });

      // Verify result
      expect(result).toBeDefined();

      // Verify a new thread was created with the result
      const threads = await manager.getThreads();
      expect(threads.length).toBe(1);
      expect(threads[0].cur_state).toBe(result);
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
      expect(result).toBeDefined();

      // Verify thread state was updated
      const updatedThread = await manager.getThreadManager().get(thread.id);
      expect(updatedThread?.cur_state).toBe(result);
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
      expect(manager).toBeDefined();
      expect(manager instanceof GraphManager).toBe(true);
    });

    it("should maintain proper references between components", () => {
      const manager1 = GRAPH_REGISTRY.getManager(testGraph.graph_name);
      const manager2 = GRAPH_REGISTRY.getManager(testGraph.graph_name);

      // Should return the same instance
      expect(manager1).toBe(manager2);
    });
  });
});
