import { interrupt } from "@langchain/langgraph";

export type TInterrupt = {
    query: string;
    values?: Record<string, unknown>;
    expects?: "number" | "boolean" | "string" | "object" | "array";
};

export const interruptGraph = (vals: TInterrupt) => {
    return interrupt(vals);
};
