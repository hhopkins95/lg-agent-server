// import type { TAssistant, TSavedThread } from "@/core/types";
// import { afterEach, beforeEach, describe, expect, it } from "bun:test";
// import { GraphStateManager } from "../graph";

// import { GraphDefinition } from "@/__example-agents__/reAct/graph";
// import { HumanMessage } from "@langchain/core/messages";

// const TestGraphDef = GraphDefinition;

// describe("GraphStateManager", () => {
//   let graphManager: GraphStateManager<typeof TestGraphDef>;
//   let assistantStore: InMemoryStore<
//     TAssistant<typeof TestGraphDef["config_annotation"]>
//   >;
//   let threadStore: InMemoryStore<
//     TSavedThread<typeof TestGraphDef["state_annotation"]> & {
//       assistant_id?: string;
//     }
//   >;

//   beforeEach(async () => {
//     // Initialize stores and graph manager
//     assistantStore = new InMemoryStore();
//     threadStore = new InMemoryStore();
//     graphManager = new GraphStateManager(
//       TestGraphDef,
//       assistantStore,
//       threadStore,
//     );
//     await graphManager.initialize();
//   });

//   afterEach(async () => {
//     // Clean up stores
//     await assistantStore.clear();
//     await threadStore.clear();
//   });

//   describe("basic operations", () => {
//     it("should create an assistant", async () => {
//       // Create assistant with test config
//       const assistant = await graphManager.createAssistant({
//         graph_name: TestGraphDef.name,
//         description: "test assistant",
//         config: TestGraphDef.default_config!,
//       });
//       // Verify assistant was created with correct properties
//       expect(assistant).toBeDefined();
//       expect(assistant.graph_name).toBe(TestGraphDef.name);
//       expect(assistant.description).toBe("test assistant");
//     });

//     it("should create a thread", async () => {
//       // Create assistant first
//       const assistant = await graphManager.createAssistant({
//         graph_name: TestGraphDef.name,
//         description: "test assistant",
//         config: TestGraphDef.default_config!,
//       });
//       // Create thread associated with the assistant
//       const thread = await graphManager.createThread({
//         assistant_id: assistant.id,
//       });
//       // Verify thread was created with correct properties
//       expect(thread).toBeDefined();
//       expect(thread.assistant_id).toBe(assistant.id);
//     });

//     it("should get all assistants", async () => {
//       // Create multiple assistants
//       await graphManager.createAssistant({
//         graph_name: TestGraphDef.name,
//         description: "assistant1",
//         config: TestGraphDef.default_config!,
//       });

//       // Verify listAllAssistants returns correct list
//       const assistants = await graphManager.listAllAssistants();
//       expect(assistants.length).toBe(2); // should be created assistant and default assistant
//     });

//     it("should get default assistant", async () => {
//       const defaultAssistant = await graphManager.getDefaultAssistant();
//       expect(defaultAssistant).toBeDefined();
//       expect(defaultAssistant?.id).toBe("__DEFAULT__");
//     });

//     it("should get all threads", async () => {
//       // Create multiple threads
//       const assistant = await graphManager.createAssistant({
//         graph_name: TestGraphDef.name,
//         description: "test assistant",
//         config: TestGraphDef.default_config!,
//       });
//       await graphManager.createThread({
//         assistant_id: assistant.id,
//       });
//       await graphManager.createThread({
//         assistant_id: assistant.id,
//       });
//       // Verify listAllThreads returns correct list
//       const threads = await graphManager.listAllThreads();
//       expect(threads.length).toBe(2);
//     });
//   });

//   describe("graph execution", () => {
//     let testAssistant: TAssistant<typeof TestGraphDef["config_annotation"]>;
//     let testThread: TSavedThread<typeof TestGraphDef["state_annotation"]> & {
//       assistant_id?: string;
//     };

//     beforeEach(async () => {
//       // Create test assistant and thread for execution tests
//       testAssistant = await graphManager.createAssistant({
//         graph_name: TestGraphDef.name,
//         description: "test assistant",
//         config: TestGraphDef.default_config!,
//       });
//       testThread = await graphManager.createThread({
//         assistant_id: testAssistant.id,
//       });
//     });

//     it("should invoke graph with existing assistant and thread", async () => {
//       // Test invokeGraph with existing assistant/thread
//       const initialState = { messages: [], count: 0 };
//       const result = await graphManager.invokeGraph({
//         threadId: testThread.id,
//         state: initialState,
//       });
//       // Verify state updates correctly
//       expect(result).toBeDefined();
//       expect(result.count).toBe(1);
//       expect(Array.isArray(result.messages)).toBe(true);
//     });

//     it("should invoke graph with new thread creation", async () => {
//       // Test invokeGraph with shouldCreateThread=true
//       const initialState = { messages: [], count: 0 };
//       const result = await graphManager.invokeGraph({
//         threadId: testThread.id,
//         state: initialState,
//         shouldCreateThread: true,
//       });
//       // Verify new thread created and state updated
//       expect(result).toBeDefined();
//       expect(result.count).toBe(1);
//       expect(Array.isArray(result.messages)).toBe(true);
//     });

//     it("should stream graph execution", async () => {
//       // Test streamGraph
//       const initialState = {
//         messages: [new HumanMessage("Hello, what is your name?")],
//         count: 0,
//       };
//       const stream = graphManager.streamGraph({
//         threadId: testThread.id,
//         state: initialState,
//       });
//       // Verify stream yields correct updates
//       const updates = [];
//       for await (const update of stream) {
//         updates.push(update);
//       }

//       expect(updates.length).toBeGreaterThan(0);
//     });
//   });

//   describe("error handling", () => {
//     it("should handle invalid assistant ID when invoking graph", async () => {
//       // Trying to invoke graph with a non-existent assistant should throw
//       await expect(
//         graphManager.invokeGraph({ assistantId: "invalid-id" }),
//       ).rejects.toThrow();
//     });

//     it("should return undefined for invalid thread ID", async () => {
//       // Getting a non-existent thread returns undefined
//       const thread = await graphManager.getThread("invalid-id");
//       expect(thread).toBeUndefined();
//     });

//     it("should handle invalid graph state", async () => {
//       // Test behavior with invalid state input
//       const assistant = await graphManager.createAssistant({
//         graph_name: TestGraphDef.name,
//         description: "test",
//         config: TestGraphDef.default_config!,
//       });
//       const thread = await graphManager.createThread({
//         assistant_id: assistant.id,
//       });
//       const invalidState = { invalid: "state" };
//       await expect(
//         graphManager.invokeGraph({
//           threadId: thread.id,
//           state: invalidState as any,
//         }),
//       ).rejects.toThrow();
//     });
//   });

//   describe("memory", () => {
//     it("should remember thread state", async () => {
//       const thread = await graphManager.createThread();
//       const thread_state = await graphManager.getThreadState(thread.id);
//       expect(thread_state).toBeUndefined();

//       const initialState = { messages: [], count: 0 };
//       await graphManager.invokeGraph({
//         state: initialState,
//         threadId: thread.id,
//       });

//       const thread_state2 = await graphManager.getThreadState(thread.id);
//       expect(thread_state2).toBeDefined();
//     });
//   });
// });
