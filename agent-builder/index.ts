import type { ContentAndArtifact } from "@langchain/core/tools";
import { Annotation } from "@langchain/langgraph";

type ArtifactStatus = "complete" | "in-progress" | "stale" | "not-started";

const ArtifactGeneratorStepState = <T extends readonly string[]>(props: {
    artifactNames: T;
}) => {
    type AnnotationType =
        & {
            [K in T[number]]: string;
        }
        & {
            status: ArtifactStatus;
        };

    return Annotation<AnnotationType>({
        reducer: (state, action) => action,
        default: () => {
            const entries = Object.fromEntries(
                props.artifactNames.map((name) => [name, ""]),
            ) as { [K in T[number]]: string };

            return {
                ...entries,
                status: "not-started" as ArtifactStatus,
            };
        },
    });
};

// Usage:
const foo = ArtifactGeneratorStepState({
    artifactNames: ["spec.md"] as const,
});

// foo.value only gives autocomplete for "status" -- not for "spec". How to fix?

// export const AgentBuilderState = Annotation.Root({
//     specGeneration: foo.value.specGeneration,
// });
