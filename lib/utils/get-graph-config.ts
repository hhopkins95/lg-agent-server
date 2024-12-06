import type { LangGraphRunnableConfig } from "@langchain/langgraph";

/**
 * Merges the default config with the user provided config.
 *
 * @param config
 * @param defaultConfig
 * @returns
 */
export function ensureGraphConfiguration<TConfig>(
    config: LangGraphRunnableConfig,
    defaultConfig: TConfig,
): TConfig {
    const configurable = config.configurable ?? {};
    return {
        ...defaultConfig,
        ...configurable,
    };
}
