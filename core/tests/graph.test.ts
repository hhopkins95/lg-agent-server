import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { GraphManager } from "../src/graph";
import { graphSpecification } from "../../__example_graph/example-graph";
import { HumanMessage } from "@langchain/core/messages";
import { SQLiteAppStorage } from "../src/storage/sqlite";

const TestGraphDef = graphSpecification;

describe("GraphStateManager", () => {
  let graphManager: GraphManager<typeof TestGraphDef>;

  beforeEach(async () => {
    // Initialize graph manager with SQLite storage
    graphManager = new GraphManager(
      TestGraphDef,
      new SQLiteAppStorage(":memory:"),
    );
    await graphManager.initialize();
  });

  describe("basic operations", () => {
    it("should create an assistant", async () => {
      const assistant = await graphManager.createAssistant({
        graph_name: TestGraphDef.name,
        description: "test assistant",
        config: TestGraphDef.default_config!,
      });

      expect(assistant).toBeDefined();
      expect(assistant.graph_name).toBe(TestGraphDef.name);
      expect(assistant.description).toBe("test assistant");
      expect(assistant.config?.config_value).toBe("default_config");
    });

    it("should create a thread", async () => {
      const assistant = await graphManager.createAssistant({
        graph_name: TestGraphDef.name,
        description: "test assistant",
        config: TestGraphDef.default_config!,
      });
      const thread = await graphManager.createThread(assistant.id);

      expect(thread).toBeDefined();
      expect(thread.assistant_id).toBe(assistant.id);
      expect(thread.values).toBeUndefined();
    });

    it("should get all assistants", async () => {
      await graphManager.createAssistant({
        graph_name: TestGraphDef.name,
        description: "assistant1",
        config: TestGraphDef.default_config!,
      });

      const assistants = await graphManager.listAllAssistants();
      expect(assistants.length).toBe(2); // Created assistant + default assistant
    });

    it("should get all threads", async () => {
      const assistant = await graphManager.createAssistant({
        graph_name: TestGraphDef.name,
        description: "test assistant",
        config: TestGraphDef.default_config!,
      });
      await graphManager.createThread(assistant.id);
      await graphManager.createThread(assistant.id);

      const threads = await graphManager.listThreads();
      expect(threads.length).toBe(2);
    });
  });

  describe("graph execution", () => {
    let testAssistant: Awaited<ReturnType<typeof graphManager.createAssistant>>;
    let testThread: Awaited<ReturnType<typeof graphManager.createThread>>;

    beforeEach(async () => {
      testAssistant = await graphManager.createAssistant({
        graph_name: TestGraphDef.name,
        description: "test assistant",
        config: TestGraphDef.default_config!,
      });
      testThread = await graphManager.createThread(testAssistant.id);
    });

    it("should invoke graph with initial state", async () => {
      const result = await graphManager.invokeGraph({
        thread_id: testThread.id,
        input: {
          message_input: {
            content: "Hello",
          },
        },
      });
      console.log({ result });
      expect(result.success).toBe(true);
      if (result.success && result.values) {
        expect(result.values.count).toBe(1);
        expect(Array.isArray(result.values.messages)).toBe(true);
      }
    });

    it("should stream graph execution", async () => {
      const initialState = {
        messages: [new HumanMessage("Hello, what is your name?")],
        count: 0,
      };
      const stream = graphManager.streamGraph({
        thread_id: testThread.id,
        input: {
          message_input: {
            content: "Hello",
          },
        },
      });

      const updates = [];
      for await (const update of stream) {
        updates.push(update);
      }

      expect(updates.length).toBeGreaterThan(0);
      // Verify we got state updates and/or LLM stream data
      expect(
        updates.some((update) => "full_state_update" in update) &&
          updates.some((update) => "state_llm_stream_data" in update),
      ).toBe(true);
    });
  });

  describe("error handling", () => {
    it("should handle invalid thread ID", async () => {
      const thread = await graphManager.getThread("invalid-id");
      expect(thread).toBeUndefined();
    });

    // it("should handle invalid graph state", async () => {
    //   const assistant = await graphManager.createAssistant({
    //     graph_name: TestGraphDef.name,
    //     description: "test",
    //     config: TestGraphDef.default_config!,
    //   });
    //   const thread = await graphManager.createThread(assistant.id);
    //   const invalidState = { invalid: "state" };

    //   const result = await graphManager.invokeGraph({
    //     thread_id: thread.id,
    //     state: invalidState as any,
    //   });

    //   expect(result.success).toBe(false);
    //   if (!result.success) {
    //     expect(result.error).toBeDefined();
    //   }
    // });
  });

  describe("state persistence", () => {
    it("should persist thread state after invocation", async () => {
      const assistant = await graphManager.createAssistant({
        graph_name: TestGraphDef.name,
        description: "test assistant",
        config: TestGraphDef.default_config!,
      });
      const thread = await graphManager.createThread(assistant.id);

      const initialState = { messages: [], count: 0 };
      await graphManager.invokeGraph({
        thread_id: thread.id,
        input: {
          message_input: {
            content: "Hello",
          },
        },
      });

      const updatedThread = await graphManager.getThread(thread.id);
      expect(updatedThread).toBeDefined();
      expect(updatedThread?.values?.count).toBe(1);
    });
  });
});
