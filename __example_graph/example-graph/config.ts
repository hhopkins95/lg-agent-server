import { Annotation } from "@langchain/langgraph";
import { assert, type Equals } from "tsafe";
import { z } from "zod";

//  CONFIGURATION
export const ConfigurationAnnotation = Annotation.Root({
    config_value: Annotation<string>(),
});
export const defaultConfig: typeof ConfigurationAnnotation.State = {
    config_value: "default_config",
};

export const ConfigurationSchema = z.object({
    config_value: z.string(),
});

assert<
    Equals<
        z.infer<typeof ConfigurationSchema>,
        typeof ConfigurationAnnotation.State
    >
>;
