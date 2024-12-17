import { interrupt, type LangGraphRunnableConfig } from "@langchain/langgraph";

export type TInterrupt = {
    query: string;
    values?: Record<string, unknown>;
    expects?: "number" | "boolean" | "string" | "object" | "array";
};

export const interruptGraph = async (
    vals: TInterrupt,
    config: LangGraphRunnableConfig,
) => {
    config.writer?.({ type: "interrupt", data: vals });
    return interrupt(vals);
};
