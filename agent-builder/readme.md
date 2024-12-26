# Purpose / Description :

An agent that excutes a series of steps to build another agent using preferred
patterns, customs, and tools

Constraints / Architecture :

- each state will be held / managed by it's own subgraph -- main graph will
  determine which subgraph is currently active by maintaining an overall state
  for the thread the step
- sub-agents will likely be variants of eachother -- some sort of
  'artifact-builder' graph that are executed in sequence, where the outputs of
  each step are used as inputs to the next step
- this should theoretically be a vary extensible pattern. In the future we can
  add capabilities on top of this for generation of multiple artifacts / context
  getters etc...
- set's the stage / patterns for arbitrary workflows
- each stage should be a collaborative process between the user and the agent
- input should always be dependent on the current state / step, and routed to
  the correct messages state object

# Steps :

## 1. determine project / agent requirements Agent knowledge

Collabrative process between the user and the agent to determine what the agent
/ graph needs to do.

### LLM Agent Context / Background Information Set:

- Understanding of langgraph / agent creation system

### Inputs :

- User input / message history

### Output of this step :

- Spec sheet for the agent -- comprehensive list of the agent's purpose,
  abilities, inputs, outputs, indended usage, etc... (sort of like this
  document)

## 2. Agent Design Phase :

Uses the spec sheet and user responses to generate design documentation for the
agent. This should focus on information flow, state management / design
patterns, nodes in the graph, etc... This is a description of how the agent will
actually work / be implemented from a technical level (without actually writing
any code). Determines human in the loop patterns, subgraphs, and other
implementation details.

### Context / Background Information Set:

- Understanding of langgraph / agent creation system
- Design patterns and best practices
- State management principles
- Hypershots for example graphs
- Mermaid diagramming principles

### Inputs :

- User input / message history
- Spec sheet for the agent (from step 1)

### Outputs of this step :

- Agent design graph (mermaid) and technical design documentation (md). Details
  interaction patterns and usage guidelines between the agent and the user

## 3a. Agent Scaffolding Phase

Uses the design graph and technical design documentation to generate the
scaffolding for the agent. This should 'stub' out the code for the agent. Create
necessary files, folders, and function definitions with proper comments and
documentation

Considerations :

- should not overwrite already implemented code if not necessary / if the code
  is not being changed.

### Context / Background Information Set:

- Code preferences and best practices
- Implementation examples
- APIs for certain flows and tools

### Inputs :

- Agent design graph (from step 2)
- Technical design documentation (from step 2)
- Current files / folders

### Outputs of this step :

- Scaffolding for the agent. Placeholders for code / prompts

## 3b. Implement Agent Code Phase

- write code based on the agent design graph and technical design documentation
- verify with unit tests where applicable, and reflection agents

## 3c. Implement Agent Prompts Phase

- use prompting guidelines and node descriptions to generate robust prompts for
  each node, utilizing proper context depending on the node
