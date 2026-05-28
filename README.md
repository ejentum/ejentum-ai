# ejentum-ai

[Vercel AI SDK](https://sdk.vercel.ai) integration for the [Ejentum](https://ejentum.com) Reasoning Harness. `createEjentumTools()` returns eight agent-callable tools you pass to `generateText`/`streamText`: four dynamic (`reasoning`, `code`, `anti-deception`, `memory`) plus four adaptive (`adaptive-reasoning`, `adaptive-code`, `adaptive-anti-deception`, `adaptive-memory`) that pre-fit the cognitive operation to the caller's task via an adapter LLM.

Each operation in the Ejentum library (679 of them, organized across four cognitive harnesses each with dynamic and adaptive variants) is engineered in **two layers**:

- a **natural-language procedure** the model can read, naming the steps to take and the failure pattern to refuse, and
- an **executable reasoning topology**: a graph-shaped plan over those steps. The plan names explicit decision points where the model branches, parallel branches that run and rejoin, bounded loops that run until convergence, named meta-cognitive moments where the model is asked to stop, look at its own working, and re-enter at a specific step, plus escape paths for when the prescribed plan stops fitting the task at hand.

The natural-language layer tells the model *what* to do. The topology layer pins down *how* those steps connect: where to decide, where to loop, where to stop and look at itself. Together they act as a persistent attention anchor that survives long context windows and multi-turn execution chains, which is precisely where a model's own reasoning template typically decays.

## Installation

```bash
npm install ejentum-ai
# peer deps (you almost certainly have these already)
npm install ai zod
```

## Configuration

Get an Ejentum API key at <https://ejentum.com/pricing>. The 30-day free trial (no card required) includes 1,000 dynamic reasoning calls; adaptive tools require Go or Super.

```bash
export EJENTUM_API_KEY="ej_..."
```

Or pass it explicitly: `createEjentumTools({ apiKey: "..." })`.

## Usage

```ts
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createEjentumTools } from "ejentum-ai";

const { text } = await generateText({
  model: openai("gpt-4o"),
  tools: createEjentumTools(), // reads EJENTUM_API_KEY from env
  prompt:
    "We've spent three months on the GraphQL gateway. " +
    "Should we keep going or pivot to REST?",
  maxSteps: 5,
});

console.log(text);
```

The model reads each tool's description and routes to `anti-deception` on the sunk-cost framing, `reasoning` on a clean analytical question, etc.

### Streaming

```ts
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { createEjentumTools } from "ejentum-ai";

const result = streamText({
  model: anthropic("claude-sonnet-4-6"),
  tools: createEjentumTools({ apiKey: process.env.EJENTUM_API_KEY }),
  prompt: "Why does our nightly ETL fail intermittently?",
  maxSteps: 5,
});

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
```

### Pick a subset of harnesses

```ts
import { createReasoningTool, createAntiDeceptionTool } from "ejentum-ai";

const tools = {
  reasoning: createReasoningTool(),
  "anti-deception": createAntiDeceptionTool(),
  // ...your other non-Ejentum tools
};
```

> **Hyphenated keys.** In Vercel AI SDK the OBJECT KEY is the tool name shown to the LLM. The default `createEjentumTools()` returns hyphenated canonical keys (`reasoning`, `code`, `anti-deception`, `memory`, `adaptive-reasoning`, `adaptive-code`, `adaptive-anti-deception`, `adaptive-memory`) to match the API mode strings exactly. If you build the object yourself, quote the hyphenated keys.

## The eight tools

### Dynamic (single retrieval, all tiers including the 30-day free trial)

| Tool key | Best for | Library size |
|---|---|---|
| `reasoning` | Analytical, diagnostic, planning, multi-step tasks spanning abstraction, time, causality, simulation, spatial, and metacognition | 311 operations |
| `code` | Code generation, refactoring, review, and debugging across the software-engineering layer | 128 operations |
| `anti-deception` | Prompts that pressure the agent to validate, certify, or soften an honest assessment | 139 operations |
| `memory` | Sharpening an observation already formed about cross-turn drift. Filter-oriented, not write-oriented. Format `query` as `"I noticed X. This might mean Y. Sharpen: Z."` | 101 operations |

### Adaptive (top-k retrieval + adapter LLM rewrites operation to fit the task; Go or Super tier required)

| Tool key | When to prefer over the dynamic version |
|---|---|
| `adaptive-reasoning` | High-stakes analytical work where every DAG node should be mapped to your specifics before generation. Cost ~2-3s vs ~1s for `reasoning`. |
| `adaptive-code` | Security-critical reviews, refactor-heavy diffs, or any code work where every verification step should be concretized to language, framework, and failure modes. |
| `adaptive-anti-deception` | When the stakes of a soft or sycophantic answer are high; detection topology gates are concretized to the exact pressure or framing trap at play. |
| `adaptive-memory` | When the dynamic memory tool's general scaffold is not sharp enough for the perception being formed. Observe FIRST, then call. |

## What an injection looks like

A real `reasoning` mode response on the query `investigate why our nightly ETL job has started failing intermittently over the past two weeks; nothing in the code or schema has changed`:

```
[NEGATIVE GATE]
The server's response time was accepted as average, despite a suspicious
rhythm break in its timing pattern.

[PROCEDURE]
Step 1: Establish baseline timing profiles by extracting historical
durations and intervals for each event type. Step 2: Compare each observed
timing against its baseline and compute deviation magnitude. Step 3:
Classify anomalies as too fast, too slow, too early, or too late, and rank
by severity. ... Step 5: If deviation exceeds two standard deviations,
probe root cause by tracing upstream dependencies. ...

[REASONING TOPOLOGY]
S1:durations -> FIXED_POINT[baselines] -> N{dismiss_timing_deviations_
without_investigation} -> for_each: S2:compare -> S3:deviation ->
G1{>2sigma?} --yes-> S4:classify -> S5:probe_cause -> FLAG -> continue --no->
S6:validate -> continue -> all_checked -> OUT:anomaly_report

[TARGET PATTERN]
Establish timing baselines by extracting historical response intervals.
Compare current server response time to this baseline. ...

[FALSIFICATION TEST]
If no event timing is flagged as suspiciously fast or slow relative to
baseline, temporal anomaly detection was not active.

Amplify: timing baseline comparison; anomaly classification; security
context elevation
Suppress: average timing acceptance; outlier normalization
```

The model reads both the natural-language `[PROCEDURE]` and the graph-logic `[REASONING TOPOLOGY]` before generating its user-facing answer. The bracketed labels are instructions to the model, not content to display.

## API reference

```ts
import { createEjentumTools, type EjentumConfig } from "ejentum-ai";

createEjentumTools(config?: EjentumConfig): EjentumTools
```

| Config field | Default | Description |
|---|---|---|
| `apiKey` | `process.env.EJENTUM_API_KEY` | Ejentum API key. |
| `apiUrl` | `https://api.ejentum.com/harness/` | Override only if you self-host the gateway. |
| `timeoutMs` | `10000` | Per-call HTTP timeout in milliseconds. |

Per-tool factories (all accept the same `EjentumConfig` and return a Vercel AI SDK `Tool`):

- Dynamic: `createReasoningTool`, `createCodeTool`, `createAntiDeceptionTool`, `createMemoryTool`
- Adaptive: `createAdaptiveReasoningTool`, `createAdaptiveCodeTool`, `createAdaptiveAntiDeceptionTool`, `createAdaptiveMemoryTool`

Errors are returned as human-readable strings from `execute` (no exceptions cross the tool boundary, so a step never crashes the run).

## ejentum-mcp alternative

If you'd rather wire the same eight tools via the Model Context Protocol (one MCP server consumable from any MCP-aware framework), Ejentum hosts the MCP server at `https://api.ejentum.com/mcp` with Bearer auth. From Vercel AI SDK:

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

This `ejentum-ai` package is the lighter-deps direct path; the MCP server is the universal protocol path. Either works.

## Compatibility

- Node.js 18+
- Vercel AI SDK 3.x (peer dep `ai >=3.0.0`)
- Zod 3.x (peer dep `zod ^3.23.0`)
- TypeScript 5.x

## Resources

- Ejentum homepage: <https://ejentum.com>
- Pricing: <https://ejentum.com/pricing>
- API reference: <https://ejentum.com/docs/api_reference>
- "Why LLM Agents Fail" essay: <https://ejentum.com/blog/why-llm-agents-fail>
- "Under Pressure" research paper: <https://doi.org/10.5281/zenodo.19392715>
- Vercel AI SDK documentation: <https://sdk.vercel.ai>

## License

[MIT](./LICENSE)
