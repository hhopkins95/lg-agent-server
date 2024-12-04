import * as tslab from "tslab";
import { CompiledStateGraph } from "@langchain/langgraph";

export const drawGraphPng = async (
  // deno-lint-ignore no-explicit-any
  graph: CompiledStateGraph<any, any, any>,
  path?: string,
) => {
  const representation = await graph.getGraphAsync();

  const image = await representation.drawMermaidPng();

  if (path) {
    const bytes = await image.bytes();
    await Deno.writeFile(path, bytes);
  } else {
    // this will disply in jupyter
    console.log("Drawing graph...");
    const arrayBuffer = await image.arrayBuffer();
    await tslab.display.png(new Uint8Array(arrayBuffer));
  }
};
