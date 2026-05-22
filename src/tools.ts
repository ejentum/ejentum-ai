/**
 * Vercel AI SDK `tool()` factories for the Ejentum Reasoning Harness.
 *
 * Each tool is built with `tool()` from the `ai` package: a Zod
 * schema for the input, a description the LLM reads, and an
 * `execute` async function that calls the Ejentum Logic API.
 *
 * The bracketed labels in the returned scaffold (`[NEGATIVE GATE]`,
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
        "For the memory tool, format as: 'I noticed [X]. This " +
        "might mean [Y]. Sharpen: [Z].'",
    ),
});

/**
 * Reasoning-mode harness tool. Call BEFORE the agent performs
 * analysis, diagnosis, planning, or any multi-step task. Library
 * of 311 reasoning operations spanning abstraction, time,
 * causality, simulation, spatial, and metacognition.
 */
export function createReasoningTool(config: EjentumConfig = {}) {
  return tool({
    description:
      "Retrieve a reasoning scaffold before any analytical, " +
      "diagnostic, planning, or multi-step task. Returns a " +
      "structured scaffold with a named failure pattern, an " +
      "executable procedure, a reasoning topology (graph DAG), " +
      "and a falsification test from a library of 311 reasoning " +
      "operations. Use 'query' to describe what the agent is " +
      "about to work on in 1-2 sentences.",
    parameters: querySchema,
    execute: async ({ query }) => callLogicApi("reasoning", query, config),
  });
}

/**
 * Code-mode harness tool. Call BEFORE the agent produces or
 * reviews code. Library of 128 software-engineering operations
 * covering correctness, refactor safety, contract preservation,
 * edge case coverage, error path discipline.
 */
export function createCodeTool(config: EjentumConfig = {}) {
  return tool({
    description:
      "Retrieve a code scaffold before any code generation, " +
      "refactoring, review, or debugging task. Returns a " +
      "structured scaffold with a named code-failure pattern, an " +
      "engineering procedure, a reasoning topology (graph DAG), " +
      "and a verification step from a library of 128 code " +
      "operations. Use 'query' to describe what the agent is " +
      "coding or reviewing in 1-2 sentences; include the failure " +
      "risk to avoid where possible.",
    parameters: querySchema,
    execute: async ({ query }) => callLogicApi("code", query, config),
  });
}

/**
 * Anti-deception harness tool. Call BEFORE the agent responds to
 * prompts that pressure validation, manufactured agreement,
 * authority appeals, fabricated commitments, or any setup where
 * the obvious helpful answer would compromise honesty. Library of
 * 139 anti-deception operations spanning sycophancy,
 * hallucination, deception, adversarial framing, judgment, and
 * executive control.
 */
export function createAntiDeceptionTool(config: EjentumConfig = {}) {
  return tool({
    description:
      "Retrieve an anti-deception scaffold before responding to " +
      "any prompt that pressures the agent to validate, certify, " +
      "or soften an honest assessment. Returns a structured " +
      "scaffold with a named deception pattern, an integrity " +
      "procedure, a detection topology (graph DAG with " +
      "omission-bias gates), and an integrity check. Use 'query' " +
      "to describe the integrity dynamic at play in 1-2 sentences.",
    parameters: querySchema,
    execute: async ({ query }) =>
      callLogicApi("anti-deception", query, config),
  });
}

/**
 * Memory-mode harness tool. Call ONLY when sharpening an
 * observation the agent has already formed about cross-turn
 * drift or pattern. Filter-oriented, not write-oriented; do not
 * call for fact extraction. Library of 101 perception operations.
 */
export function createMemoryTool(config: EjentumConfig = {}) {
  return tool({
    description:
      "Retrieve a memory-mode scaffold ONLY when sharpening an " +
      "observation the agent has already formed about cross-turn " +
      "drift or pattern. Filter-oriented, not write-oriented; do " +
      "not call for fact extraction. Format 'query' as: 'I " +
      "noticed [X]. This might mean [Y]. Sharpen: [Z].' Calling " +
      "with an empty mind defeats the harness.",
    parameters: querySchema,
    execute: async ({ query }) => callLogicApi("memory", query, config),
  });
}

/**
 * Return value of `createEjentumTools`. Pass this directly to
 * `generateText({ tools, ... })` or `streamText({ tools, ... })`.
 */
export interface EjentumTools {
  harness_reasoning: ReturnType<typeof createReasoningTool>;
  harness_code: ReturnType<typeof createCodeTool>;
  harness_anti_deception: ReturnType<typeof createAntiDeceptionTool>;
  harness_memory: ReturnType<typeof createMemoryTool>;
}

/**
 * Create all four Ejentum harness tools with shared config.
 *
 * Pass the returned object as the `tools` argument of
 * `generateText` or `streamText`. The LLM picks the right
 * harness per turn based on each tool's description.
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
    harness_reasoning: createReasoningTool(config),
    harness_code: createCodeTool(config),
    harness_anti_deception: createAntiDeceptionTool(config),
    harness_memory: createMemoryTool(config),
  };
}
