import { Annotation } from "@langchain/langgraph";

//  CONFIGURATION
export const GraphConfigurationAnnotation = Annotation.Root({
    config_value: Annotation<string>(),
});
export const defaultConfig: typeof GraphConfigurationAnnotation.State = {
    config_value: "default_config",
};
