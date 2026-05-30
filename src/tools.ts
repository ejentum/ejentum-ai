/**
 * Vercel AI SDK `tool()` factories for the Ejentum Reasoning Harness.
 *
 * Eight tools: four dynamic (`reasoning`, `code`, `anti-deception`,
 * `memory`) and four adaptive (`adaptive-reasoning`, `adaptive-code`,
 * `adaptive-anti-deception`, `adaptive-memory`) that pre-fit the
 * cognitive operation to the caller's task via an adapter LLM.
 * Adaptive tools require the Go or Super tier.
 *
 * Tool name == API mode string. In Vercel AI SDK, the key on the
 * returned object IS the tool name shown to the LLM, so the keys
 * here use hyphens to match the canonical naming.
 *
 * The bracketed labels in the returned injection (`[NEGATIVE GATE]`,
 * `[PROCEDURE]`, `[REASONING TOPOLOGY]`, `[FALSIFICATION TEST]`,
 * etc.) are instructions to the agent, not content to display.
 */

import { tool } from "ai";
import { z } from "zod";

import { callLogicApi, type EjentumConfig } from "./api.js";

const querySchema = z.object({
  query: z
    .string()
    .min(1)
    .describe(
      "A 1-2 sentence description of the task the agent is about " +
        "to work on. Be specific about the failure mode to avoid. " +
        "For memory and adaptive-memory, format as: 'I noticed [X]. " +
        "This might mean [Y]. Sharpen: [Z].'",
    ),
});

// ---------------------------------------------------------------------------
// Dynamic tools (single retrieval, all tiers including the 30-day trial)
// ---------------------------------------------------------------------------

export function createReasoningTool(config: EjentumConfig = {}) {
  return tool({
    description:
      "Retrieve a reasoning injection before any analytical, " +
      "diagnostic, planning, or multi-step task. Returns a structured " +
      "injection with a named failure pattern, an executable procedure, " +
      "a reasoning topology (graph DAG), and a falsification test from " +
      "a library of 311 reasoning operations. Use 'query' to describe " +
      "what the agent is about to work on in 1-2 sentences.",
    parameters: querySchema,
    execute: async ({ query }) => callLogicApi("reasoning", query, config),
  });
}

export function createCodeTool(config: EjentumConfig = {}) {
  return tool({
    description:
      "Retrieve a code injection before any code generation, " +
      "refactoring, review, or debugging task. Returns a structured " +
      "injection with a named code-failure pattern, an engineering " +
      "procedure, a reasoning topology (graph DAG), and a verification " +
      "step from a library of 128 code operations.",
    parameters: querySchema,
    execute: async ({ query }) => callLogicApi("code", query, config),
  });
}

export function createAntiDeceptionTool(config: EjentumConfig = {}) {
  return tool({
    description:
      "Retrieve an anti-deception injection before responding to any " +
      "prompt that pressures the agent to validate, certify, or soften " +
      "an honest assessment. Returns a structured injection with a " +
      "named deception pattern, an integrity procedure, a detection " +
      "topology (graph DAG with omission-bias gates), and an integrity " +
      "check from a library of 139 operations.",
    parameters: querySchema,
    execute: async ({ query }) =>
      callLogicApi("anti-deception", query, config),
  });
}

export function createMemoryTool(config: EjentumConfig = {}) {
  return tool({
    description:
      "Retrieve a memory-mode injection ONLY when sharpening an " +
      "observation the agent has already formed about cross-turn " +
      "drift or pattern. Filter-oriented, not write-oriented; do not " +
      "call for fact extraction. Format 'query' as: 'I noticed [X]. " +
      "This might mean [Y]. Sharpen: [Z].' Library of 101 perception " +
      "operations.",
    parameters: querySchema,
    execute: async ({ query }) => callLogicApi("memory", query, config),
  });
}

// ---------------------------------------------------------------------------
// Adaptive tools (top-k retrieval + LLM adapter rewrites operation to fit
// the specific task; requires Go or Super tier)
// ---------------------------------------------------------------------------

export function createAdaptiveReasoningTool(config: EjentumConfig = {}) {
  return tool({
    description:
      "Same triggers as `reasoning`, but the returned operation is " +
      "REWRITTEN by an adapter LLM to fit the specific task. Procedure " +
      "steps and topology DAG nodes are concretized with task-specific " +
      "language. Use when the dynamic reasoning tool is too generic, or " +
      "for high-stakes analytical work where every DAG node should " +
      "already be mapped to the task before generation. Requires Go or " +
      "Super tier (250 or 1500 adaptive calls per month). Cost ~2-3s.",
    parameters: querySchema,
    execute: async ({ query }) =>
      callLogicApi("adaptive-reasoning", query, config),
  });
}

export function createAdaptiveCodeTool(config: EjentumConfig = {}) {
  return tool({
    description:
      "Same triggers as `code`, but the returned operation is REWRITTEN " +
      "by an adapter LLM to fit the specific code task: language, " +
      "framework, and failure modes are concretized in every step. Use " +
      "for security-critical reviews, refactor-heavy diffs, or any code " +
      "work where every verification step should already be mapped to " +
      "the specifics. Requires Go or Super tier. Cost ~2-3s.",
    parameters: querySchema,
    execute: async ({ query }) =>
      callLogicApi("adaptive-code", query, config),
  });
}

export function createAdaptiveAntiDeceptionTool(config: EjentumConfig = {}) {
  return tool({
    description:
      "Same triggers as `anti-deception`, but the returned operation is " +
      "REWRITTEN by an adapter LLM to fit the specific integrity " +
      "dynamic: detection topology gates are concretized to the exact " +
      "pressure, authority appeal, or framing trap at play. Use when " +
      "stakes of a soft or sycophantic answer are high. Requires Go or " +
      "Super tier. Cost ~2-3s.",
    parameters: querySchema,
    execute: async ({ query }) =>
      callLogicApi("adaptive-anti-deception", query, config),
  });
}

export function createAdaptiveMemoryTool(config: EjentumConfig = {}) {
  return tool({
    description:
      "Same triggers as `memory`, but the returned operation is " +
      "REWRITTEN by an adapter LLM to fit the specific observation: " +
      "perception topology nodes are concretized to the specific " +
      "signal. Use when the dynamic memory tool's general scaffold is " +
      "not sharp enough for the perception being formed. Observe FIRST, " +
      "then call. Requires Go or Super tier. Cost ~2-3s.",
    parameters: querySchema,
    execute: async ({ query }) =>
      callLogicApi("adaptive-memory", query, config),
  });
}

/**
 * Return value of `createEjentumTools`. In Vercel AI SDK the OBJECT
 * KEY is the tool name shown to the LLM, so the keys here use hyphens
 * to match the canonical Ejentum naming.
 */
export interface EjentumTools {
  reasoning: ReturnType<typeof createReasoningTool>;
  code: ReturnType<typeof createCodeTool>;
  "anti-deception": ReturnType<typeof createAntiDeceptionTool>;
  memory: ReturnType<typeof createMemoryTool>;
  "adaptive-reasoning": ReturnType<typeof createAdaptiveReasoningTool>;
  "adaptive-code": ReturnType<typeof createAdaptiveCodeTool>;
  "adaptive-anti-deception": ReturnType<typeof createAdaptiveAntiDeceptionTool>;
  "adaptive-memory": ReturnType<typeof createAdaptiveMemoryTool>;
}

/**
 * Create all eight Ejentum harness tools with shared config.
 *
 * Pass the returned object as the `tools` argument of `generateText`
 * or `streamText`. The LLM picks the right harness per turn based on
 * each tool's description.
 *
 * ```ts
 * import { generateText } from "ai";
 * import { openai } from "@ai-sdk/openai";
 * import { createEjentumTools } from "ejentum-ai";
 *
 * const { text } = await generateText({
 *   model: openai("gpt-4o"),
 *   tools: createEjentumTools(),
 *   prompt: "Should we keep the GraphQL gateway or pivot to REST?",
 * });
 * ```
 *
 * @param config Shared Ejentum config (`apiKey`, `apiUrl`,
 *   `timeoutMs`). If `apiKey` is omitted, each tool reads
 *   `EJENTUM_API_KEY` from the environment at call time.
 */
export function createEjentumTools(
  config: EjentumConfig = {},
): EjentumTools {
  return {
    reasoning: createReasoningTool(config),
    code: createCodeTool(config),
    "anti-deception": createAntiDeceptionTool(config),
    memory: createMemoryTool(config),
    "adaptive-reasoning": createAdaptiveReasoningTool(config),
    "adaptive-code": createAdaptiveCodeTool(config),
    "adaptive-anti-deception": createAdaptiveAntiDeceptionTool(config),
    "adaptive-memory": createAdaptiveMemoryTool(config),
  };
}
