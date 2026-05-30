# ejentum-ai

[Vercel AI SDK](https://sdk.vercel.ai) integration for the Ejentum Reasoning Harness. `createEjentumTools()` returns an object of eight tools you pass as the `tools` argument to `generateText` / `streamText`. Each tool calls the Ejentum API and returns a structured injection (procedure + topology DAG + cognitive payload) the LLM consumes internally before producing its response.

Use the harness before the agent generates on complex, multi-step, or multi-constraint tasks where the model's default reasoning template would miss a constraint, take a shortcut, or drift across turns. Each call returns a *cognitive operation*: a structured procedure (numbered steps with a failure pattern to refuse and a falsification test) paired with an executable reasoning topology (a DAG of those steps with decision gates, parallel branches, bounded loops, and meta-cognitive exit nodes). The agent reads both layers before producing its response.

Four dynamic tools (`reasoning`, `code`, `anti-deception`, `memory`) are available on all tiers including the 30-day free trial. Four adaptive tools (`adaptive-reasoning`, `adaptive-code`, `adaptive-anti-deception`, `adaptive-memory`) additionally run an adapter LLM step that rewrites the matched operation's procedure and topology with task-specific identifiers; they require the Go or Super tier.

## Install

```bash
npm install ejentum-ai
# peer deps
npm install ai zod
```

## Configuration

```bash
export EJENTUM_API_KEY="ej_..."
```

Or pass it explicitly: `createEjentumTools({ apiKey: "..." })`. Get a key at [ejentum.com/pricing](https://ejentum.com/pricing).

## Usage

```ts
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createEjentumTools } from "ejentum-ai";

const { text } = await generateText({
  model: openai("gpt-4o"),
  tools: createEjentumTools(),
  prompt:
    "We have spent three months on the GraphQL gateway. " +
    "Should we keep going or pivot to REST?",
  maxSteps: 5,
});
```

`generateText` reads each tool's description and dispatches to one when its trigger matches.

### Pick a subset of tools

```ts
import { createReasoningTool, createAntiDeceptionTool } from "ejentum-ai";

const tools = {
  reasoning: createReasoningTool(),
  "anti-deception": createAntiDeceptionTool(),
};
```

Hyphenated keys must be quoted in the object literal. The key IS the tool name the LLM sees.

### Explicit API key

```ts
const tools = createEjentumTools({ apiKey: "ej_..." });
```

### Streaming

```ts
import { streamText } from "ai";
const result = streamText({ model: ..., tools: createEjentumTools(), prompt: "..." });
for await (const chunk of result.textStream) process.stdout.write(chunk);
```

## Tool inventory

In Vercel AI SDK the object key passed to `tools: {...}` IS the LLM-facing tool name, so `createEjentumTools()` uses canonical hyphenated keys.

### Dynamic (all tiers)

| Object key | Mode string | Library size |
|---|---|---:|
| `reasoning` | `reasoning` | 311 operations |
| `code` | `code` | 128 operations |
| `anti-deception` | `anti-deception` | 139 operations |
| `memory` | `memory` | 101 operations |

### Adaptive (Go or Super tier)

| Object key | Mode string |
|---|---|
| `adaptive-reasoning` | `adaptive-reasoning` |
| `adaptive-code` | `adaptive-code` |
| `adaptive-anti-deception` | `adaptive-anti-deception` |
| `adaptive-memory` | `adaptive-memory` |

Each tool takes one parameter, `query: string`. Returns the injection as plain text. Errors do not throw; they return as a human-readable string from `execute` so a tool step never crashes the run.

## API reference

```ts
import { createEjentumTools, type EjentumConfig, type EjentumTools, type HarnessMode } from "ejentum-ai";

createEjentumTools(config?: EjentumConfig): EjentumTools
```

| `EjentumConfig` field | Default | Description |
|---|---|---|
| `apiKey` | `process.env.EJENTUM_API_KEY` | API key. |
| `apiUrl` | `https://api.ejentum.com/harness/` | Override for self-hosted gateway. |
| `timeoutMs` | `10000` | Per-call HTTP timeout. |

Per-tool factories (all accept the same `EjentumConfig`, return a Vercel AI SDK `Tool`):

- Dynamic: `createReasoningTool`, `createCodeTool`, `createAntiDeceptionTool`, `createMemoryTool`
- Adaptive: `createAdaptiveReasoningTool`, `createAdaptiveCodeTool`, `createAdaptiveAntiDeceptionTool`, `createAdaptiveMemoryTool`

`HarnessMode` is a string-literal union of all 8 mode strings.

## Wire contract

`createEjentumTools()` issues:

```
POST https://api.ejentum.com/harness/
Headers: Authorization: Bearer <key>, Content-Type: application/json
Body:    { "query": <string>, "mode": <one of 8 mode strings> }
Response (200): [ { "<mode>": "<injection string>" } ]
```

Full wire contract, field structure of an injection, DAG syntax, and a canonical dynamic-vs-adaptive comparison on the same query are documented in the [ejentum-mcp README](https://github.com/ejentum/ejentum-mcp#wire-contract). The wire format is identical across this package, ejentum-mcp, and every other Ejentum framework shim.

## ejentum-mcp alternative

If you would rather wire the same eight tools via MCP, the hosted MCP server at `https://api.ejentum.com/mcp` is consumable from Vercel AI SDK:

```ts
import { experimental_createMCPClient as createMCPClient } from "ai";

const mcp = await createMCPClient({
  transport: {
    type: "sse",
    url: "https://api.ejentum.com/mcp",
    headers: { Authorization: `Bearer ${process.env.EJENTUM_API_KEY}` },
  },
});
const tools = await mcp.tools();
```

This `ejentum-ai` package is the direct-REST path with lighter peer-dep footprint; MCP is the universal-protocol path.

## Compatibility

- Node.js 18+
- `ai` (Vercel AI SDK) 3.x (peer dep `>=3.0.0`)
- `zod` 3.x (peer dep `^3.23.0`)
- TypeScript 5.x

## License

[MIT](./LICENSE)


## Measured effects

The Ejentum harness is benchmarked publicly under CC BY 4.0 at [github.com/ejentum/benchmarks](https://github.com/ejentum/benchmarks):

- **ELEPHANT** sycophancy: 5.8% composite on GPT-4o (40 real Reddit scenarios)
- **LiveCodeBench Hard**: 85.7% to 100% on Claude Opus (28 competitive programming tasks)
- **Memory retention**: 50% fewer stale facts served (20-turn implicit state changes)
- Plus per-harness numbers across BBH/CausalBench/MuSR, ARC-AGI-3, SciCode, and perception tasks

Methodology, scenarios, run scripts, and raw outputs are all in-repo.
