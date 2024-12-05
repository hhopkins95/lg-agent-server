export type TModelDef = {
    source: "openrouter" | "ollama";
    name: string;
    description?: string;
    supports_tools?: boolean;
    /**
     * Context token length in thousands of tokens
     */
    context?: number;
};

const OpenRouterModelKeys = {
    claude3_5: "claude3_5",
    gpt4mini: "gpt4mini",
    geminiFlash1_5: "geminiFlash1_5",
} as const;

export const OPEN_ROUTER_MODELS: Record<
    keyof typeof OpenRouterModelKeys,
    TModelDef
> = {
    claude3_5: {
        source: "openrouter",
        name: "anthropic/claude-3.5-sonnet:beta",
        description: "Claude 3.5",
        supports_tools: true,
        context: 200,
    },
    gpt4mini: {
        source: "openrouter",
        name: "openai/gpt-4o-mini",
        description: "GPT-4 Mini",
        supports_tools: true,
        context: 128,
    },
    geminiFlash1_5: {
        source: "openrouter",
        name: "google/gemini-flash-1.5",
        description: "Gemini Flash 1.5",
        supports_tools: true,
        context: 1000,
    },
};

const OllamaModelKeys = {
    llama3_2__3b: "llama3_2__3b",
    llama3_1__70b: "llama3_1__70b",
    qwen2_5__05b: "qwen2_5__05b",
};

export const OLLAMA_MODELS: Record<keyof typeof OllamaModelKeys, TModelDef> = {
    llama3_2__3b: {
        source: "ollama",
        name: "llama3.2:3b",
        description: "Llama 3.2 3B param",
        supports_tools: false,
    },
    llama3_1__70b: {
        source: "ollama",
        name: "llama3.1:70b",
        description: "Llama 3.1 70B param",
        supports_tools: true,
        context: 128,
    },
    qwen2_5__05b: {
        source: "ollama",
        name: "qwen2.5-coder:0.5b",
        description: "Qwen 2.5",
        supports_tools: false,
    },
} as const;

export const ALL_MODELS = {
    ...OPEN_ROUTER_MODELS,
    ...OLLAMA_MODELS,
} as const;

export type AllModelKeys = keyof typeof ALL_MODELS;
