<!-- image -->

<!-- image -->

- People
- Community
- Error reference
- External guides
- Contributing

- v0.3
- v0.2
- v0.1

- LangSmith
- LangSmith Docs
- LangChain Hub
- LangServe
- Python Docs

- Introduction
- Tutorials
    - Build a Question Answering application over a Graph Database
    - Tutorials
    - Build a Simple LLM Application with LCEL
    - Build a Chatbot
    - Conversational RAG
    - Build an Extraction Chain
    - Summarize Text
    - Tagging
    - Build a Local RAG Application
    - Build a PDF ingestion and Question/Answering system
    - Build a Query Analysis System
    - Build a Retrieval Augmented Generation (RAG) App
    - Build a Question/Answering system over SQL data
- How-to guides

- How-to guides
- How to add memory to chatbots
- How to use example selectors
- Installation
- How to stream responses from an LLM
- How to stream chat model responses
- How to embed text data
- How to use few shot examples in chat models
- How to cache model responses
- How to cache chat model responses
- Richer outputs
- How to use few shot examples
- How to use output parsers to parse an LLM response into structured format
- How to return structured data from a model
- How to add ad-hoc tool calling capability to LLMs and Chat Models
- Richer outputs
- How to do per-user retrieval
- How to track token usage
- How to track token usage
- How to pass through arguments from one step to the next
- How to compose prompts together
- How to use legacy LangChain Agents (AgentExecutor)
- How to add values to a chain's state
- How to attach runtime arguments to a Runnable
- How to cache embedding results
- How to attach callbacks to a module
- How to pass callbacks into a module constructor
- How to dispatch custom callback events
- How to pass callbacks in at runtime
- How to await callbacks in serverless environments
- How to cancel execution
- How to split by character
- How to init any model in one line
- How to do retrieval
- How to add tools to chatbots
- How to split code
- How to do retrieval with contextual compression
- How to convert Runnables to Tools
- How to create custom callback handlers
- How to write a custom retriever class
- How to create Tools
- How to debug your LLM apps
- How to load CSV data
- How to write a custom document loader
- How to load data from a directory
- How to load HTML
- How to load Markdown
- How to load PDF files
- How to load JSON data
- How to combine results from multiple retrievers
- How to select examples from a LangSmith dataset
- How to select examples by length
- How to select examples by similarity
- How to use reference examples
- How to handle long text
- How to do extraction without using function calling
- Fallbacks
- Few Shot Prompt Templates
- How to filter messages
- How to run custom functions
- How to build an LLM generated UI
- How to construct knowledge graphs
- How to map values to a database
- How to improve results with prompting
- How to add a semantic layer over the database
- How to reindex data to keep your vectorstore in-sync with the underlying data source
- LangChain Expression Language Cheatsheet
- How to get log probabilities
- How to merge consecutive messages of the same type
- How to add message history
- How to migrate from legacy LangChain agents to LangGraph
- How to generate multiple embeddings per document
- How to pass multimodal data directly to models
- How to use multimodal prompts
- How to generate multiple queries to retrieve data for
- How to try to fix errors in output parsing
- How to parse JSON output
- How to parse XML output
- How to invoke runnables in parallel
- How to retrieve the whole document for a chunk
- How to partially format prompt templates
- How to add chat history
- How to return citations
- How to return sources
- How to stream from a question-answering chain
- How to construct filters
- How to add examples to the prompt
- How to deal with high cardinality categorical variables
- How to handle multiple queries
- How to handle multiple retrievers
- How to handle cases where no queries are generated
- How to recursively split text by characters
- How to reduce retrieval latency
- How to route execution within a chain
- How to do "self-querying" retrieval
- How to chain runnables
- How to split text by tokens
- How to deal with large databases
- How to use prompting to improve results
- How to do query validation
- How to stream agent data to the client
- How to stream structured output to the client
- How to stream
- How to create a time-weighted retriever
- How to return artifacts from a tool
- How to use chat models to call tools
- How to disable parallel tool calling
- How to call tools with multimodal data
- How to force tool calling behavior
- How to access the RunnableConfig from a tool
- How to pass tool outputs to chat models
- How to pass run time values to tools
- How to stream events from a tool
- How to stream tool calls
- How to use LangChain tools
- How to handle tool errors
- How to use few-shot prompting with tool calling
- How to trim messages
- How use a vector store to retrieve data
- How to create and query vector stores
- Conceptual Guide

- Agents
- Architecture
- Callbacks
- Chat history
- Chat models
- Document loaders
- Embedding models
- Evaluation
- Example selectors
- Few-shot prompting
- Conceptual guide
- Key-value stores
- LangChain Expression Language (LCEL)
- Messages
- Multimodality
- Output parsers
- Prompt Templates
- Retrieval augmented generation (rag)
- Retrieval
- Retrievers
- Runnable interface
- Streaming
- Structured outputs
- t
- String-in, string-out llms
- Text splitters
- Tokens
- Tool calling
- Tools
- Tracing
- Vector stores
- Why LangChain?
- Ecosystem

- 🦜🛠️ LangSmith
- 🦜🕸️ LangGraph.js
- Versions

- v0.3
- v0.2
- Migrating from v0.0 memory
    - How to migrate to LangGraph memory
    - How to use BaseChatMessageHistory with LangGraph
    - Migrating off ConversationTokenBufferMemory
    - Migrating off ConversationSummaryMemory or ConversationSummaryBufferMemory
- Release Policy
- Security

- 
- Conceptual Guide
- Streaming

# Streaming

- Runnable Interface
- Chat Models

Streaming is crucial for enhancing the responsiveness of applications built on LLMs. By displaying output progressively, even before a complete response is ready, streaming significantly improves user experience (UX), particularly when dealing with the latency of LLMs.

## Overview​

Generating full responses from LLMs often incurs a delay of several seconds, which becomes more noticeable in complex applications with multiple model calls. Fortunately, LLMs generate responses iteratively, allowing for intermediate results to be displayed as they are produced. By streaming these intermediate outputs, LangChain enables smoother UX in LLM-powered apps and offers built-in support for streaming at the core of its design.

In this guide, we'll discuss streaming in LLM applications and explore how LangChain's streaming APIs facilitate real-time output from various components in your application.

## What to stream in LLM applications​

In applications involving LLMs, several types of data can be streamed to improve user experience by reducing perceived latency and increasing transparency. These include:

### 1. Streaming LLM outputs​

The most common and critical data to stream is the output generated by the LLM itself. LLMs often take time to generate full responses, and by streaming the output in real-time, users can see partial results as they are produced. This provides immediate feedback and helps reduce the wait time for users.

### 2. Streaming pipeline or workflow progress​

Beyond just streaming LLM output, it’s useful to stream progress through more complex workflows or pipelines, giving users a sense of how the application is progressing overall. This could include:

- In LangGraph Workflows:
With LangGraph, workflows are composed of nodes and edges that represent various steps. Streaming here involves tracking changes to the graph state as individual nodes request updates. This allows for more granular monitoring of which node in the workflow is currently active, giving real-time updates about the status of the workflow as it progresses through different stages.
- In LCEL Pipelines:
Streaming updates from an LCEL pipeline involves capturing progress from individual sub-runnables. For example, as different steps or components of the pipeline execute, you can stream which sub-runnable is currently running, providing real-time insight into the overall pipeline's progress.

Streaming pipeline or workflow progress is essential in providing users with a clear picture of where the application is in the execution process.

### 3. Streaming custom data​

In some cases, you may need to stream custom data that goes beyond the information provided by the pipeline or workflow structure. This custom information is injected within a specific step in the workflow, whether that step is a tool or a LangGraph node. For example, you could stream updates about what a tool is doing in real-time or the progress through a LangGraph node. This granular data, which is emitted directly from within the step, provides more detailed insights into the execution of the workflow and is especially useful in complex processes where more visibility is needed.

## Streaming APIs​

LangChain two main APIs for streaming output in real-time. These APIs are supported by any component that implements the Runnable Interface, including LLMs, compiled LangGraph graphs, and any Runnable generated with LCEL.

1. stream: Use to stream outputs from individual Runnables (e.g., a chat model) as they are generated or stream any workflow created with LangGraph.
2. streamEvents: Use this API to get access to custom events and intermediate outputs from LLM applications built entirely with LCEL. Note that this API is available, but not needed when working with LangGraph.

In addition, there is a legacy streamLog API. This API is not recommended for new projects it is more complex and less feature-rich than the other streaming APIs.

### stream()​

The stream() method returns an iterator that yields chunks of output synchronously as they are produced. You can use a for await loop to process each chunk in real-time. For example, when using an LLM, this allows the output to be streamed incrementally as it is generated, reducing the wait time for users.

The type of chunk yielded by the stream() methods depends on the component being streamed. For example, when streaming from an LLM each component will be an AIMessageChunk; however, for other components, the chunk may be different.

The stream() method returns an iterator that yields these chunks as they are produced. For example,

#### Usage with chat models​

When using stream() with chat models, the output is streamed as AIMessageChunks as it is generated by the LLM. This allows you to present or process the LLM's output incrementally as it's being produced, which is particularly useful in interactive applications or interfaces.

#### Usage with LangGraph​

LangGraph compiled graphs are Runnables and support the standard streaming APIs.

When using the stream and methods with LangGraph, you can one or more streaming mode which allow you to control the type of output that is streamed. The available streaming modes are:

- "values": Emit all values of the state for each step.
- "updates": Emit only the node name(s) and updates that were returned by the node(s) after each step.
- "debug": Emit debug events for each step.
- "messages": Emit LLM messages token-by-token.

For more information, please see:

- LangGraph streaming conceptual guide for more information on how to stream when working with LangGraph.
- LangGraph streaming how-to guides for specific examples of streaming in LangGraph.

#### Usage with LCEL​

If you compose multiple Runnables using LangChain’s Expression Language (LCEL), the stream() methods will, by convention, stream the output of the last step in the chain. This allows the final processed result to be streamed incrementally. LCEL tries to optimize streaming latency in pipelines such that the streaming results from the last step are available as soon as possible.

### streamEvents​

Use the streamEvents API to access custom data and intermediate outputs from LLM applications built entirely with LCEL.

While this API is available for use with LangGraph as well, it is usually not necessary when working with LangGraph, as the stream methods provide comprehensive streaming capabilities for LangGraph graphs.

For chains constructed using LCEL, the .stream() method only streams the output of the final step from te chain. This might be sufficient for some applications, but as you build more complex chains of several LLM calls together, you may want to use the intermediate values of the chain alongside the final output. For example, you may want to return sources alongside the final generation when building a chat-over-documents app.

There are ways to do this using callbacks, or by constructing your chain in such a way that it passes intermediate
values to the end with something like chained .assign() calls, but LangChain also includes an
.streamEvents() method that combines the flexibility of callbacks with the ergonomics of .stream(). When called, it returns an iterator
which yields various types of events that you can filter and process according
to the needs of your project.

Here's one small example that prints just events containing streamed chat model output:

You can roughly think of it as an iterator over callback events (though the format differs) - and you can use it on almost all LangChain components!

See this guide for more detailed information on how to use .streamEvents(), including a table listing available events.

## Writing custom data to the stream​

To write custom data to the stream, you will need to choose one of the following methods based on the component you are working with:

1. dispatch\_events can be used to write custom data that will be surfaced through the streamEvents API. See how to dispatch custom callback events for more information.

## "Auto-Streaming" Chat Models​

LangChain simplifies streaming from chat models by automatically enabling streaming mode in certain cases, even when you're not explicitly calling the streaming methods. This is particularly useful when you use the non-streaming invoke method but still want to stream the entire application, including intermediate results from the chat model.

### How It Works​

When you call the invoke method on a chat model, LangChain will automatically switch to streaming mode if it detects that you are trying to stream the overall application.

Under the hood, it'll have invoke use the stream method to generate its output. The result of the invocation will be the same as far as the code that was using invoke is concerned; however, while the chat model is being streamed, LangChain will take care of invoking on\_llm\_new\_token events in LangChain's callback system. These callback events
allow LangGraph stream and streamEvents to surface the chat model's output in real-time.

Example:

## Related Resources​

Please see the following how-to guides for specific examples of streaming in LangChain:

- LangGraph conceptual guide on streaming
- LangGraph streaming how-to guides
- How to stream runnables: This how-to guide goes over common streaming patterns with LangChain components (e.g., chat models) and with LCEL.
- How to stream chat models
- How to stream tool calls

For writing custom data to the stream, please see the following resources:

- If using LCEL, see how to dispatch custom callback events.

#### Was this page helpful?

#### You can also leave detailed feedback on GitHub.

- Overview
- What to stream in LLM applications
    - 1. Streaming LLM outputs
    - 2. Streaming pipeline or workflow progress
    - 3. Streaming custom data
- Streaming APIs

- stream()
- streamEvents
- Writing custom data to the stream
- "Auto-Streaming" Chat Models

- How It Works
- Related Resources

- Twitter

- Python
- JS/TS

- Homepage
- Blog