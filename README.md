## Langgraph Agent Toolkit

purpose of this package : provide set of helpers and classes for building and
operating LangGraph agents.

### Dirs :

**core/**

- classes for managing graphs / state and invoking graphs
- provide support for checkpoints, threads, streaming, runs, etc..

**server/**

- boiler to generate Hono API servers for graphs
- given a graph, generate a Hono API server and typed hono RPC client for that
  graph

**cli/**

- command line interface for LangGraph agents
- communicates with a Server instance

**lib/**

- misc helpers and modules for agent development

****example_agents**/**

- example agents for testing and learning how to use LangGraph
- demonstratation different concepts / agent compositions
