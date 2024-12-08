// import type {
//     AIMessageChunk,
//     ToolMessageChunk,
// } from "@langchain/core/messages";
// import {
//     Annotation,
//     type CompiledStateGraph,
//     type StateSnapshot,
// } from "@langchain/langgraph";

// export type TAnnotation = ReturnType<typeof Annotation.Root<any>>;

// // type FooGraphDef<
// //   TStateAnnotation extends TAnnotation = TAnnotation,
// //   TStreamKeys extends keyof TStateAnnotation["State"] = keyof TStateAnnotation["State"]
// // > = {
// //   stateAnnotation: TStateAnnotation;
// //   streamKeys?: readonly TStreamKeys[];
// // };

// // type StreamYield<TGraphDef extends FooGraphDef<any, any>> = {
// //   state_llm_stream_data?: {
// //     key: TGraphDef extends FooGraphDef<any, infer K> ? K : never;
// //   };
// // };

// // const annotation = Annotation.Root({
// //   foo: Annotation<string>(),
// //   bar: Annotation<number>(),
// // });

// // const graphDef: FooGraphDef<typeof annotation, "foo"> = {
// //   stateAnnotation: annotation,
// //   streamKeys: ["foo"]
// // };

// // let streamYield: StreamYield<typeof graphDef>;
// // streamYield.state_llm_stream_data?.key; // Type is "foo"

// type FooGraphDef<
//     TStateAnnotation extends TAnnotation = TAnnotation,
//     TStateStreamKeys extends keyof TStateAnnotation["State"] =
//         keyof TStateAnnotation["State"],
//     TOtherStreamKeys extends string = string,
// > = {
//     stateAnnotation: TStateAnnotation;
//     streamKeys?: readonly TStateStreamKeys[];
//     otherStreamKeys?: readonly TOtherStreamKeys[];
// };

// type StreamYield<TGraphDef extends FooGraphDef> = {
//     state_llm_stream_data?: {
//         key: TGraphDef extends FooGraphDef<any, infer K> ? K : never;
//     };
//     other_llm_stream_data?: {
//         key: TGraphDef extends FooGraphDef<any, any, infer K> ? K : never;
//     };
// };

// const annotation = Annotation.Root({
//     foo: Annotation<string>(),
//     bar: Annotation<number>(),
// });

// // Helper function to infer types
// function createGraphDef<
//     TState extends TAnnotation,
//     TStateKeys extends keyof TState["State"],
//     TOtherKeys extends string = string,
// >(def: FooGraphDef<TState, TStateKeys, TOtherKeys>) {
//     return def;
// }

// const graphDef = createGraphDef({
//     stateAnnotation: annotation,
//     streamKeys: ["foo"],
//     otherStreamKeys: ["barsdfas"],
// });

// let streamYield: StreamYield<typeof graphDef>;
// // streamYield.state_llm_stream_data?.key; // Type is "foo"
