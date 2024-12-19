import type { StateSnapshot } from "@langchain/langgraph";
import type { TThreadStatus } from "./types";

const getThreadStatusFromSnapshot = (
    snapshot: StateSnapshot,
): TThreadStatus => {
    const { next, tasks } = snapshot;

    return {
        status: "idle",
    };
};
