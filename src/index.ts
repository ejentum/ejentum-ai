/**
 * ejentum-ai: Vercel AI SDK integration for the Ejentum Reasoning Harness.
 *
 * Re-exports the four Ejentum harness tools and the
 * `createEjentumTools()` factory. Pass the factory's return value
 * to `generateText({ tools, ... })` or `streamText({ tools, ... })`.
 *
 * Free and paid tiers at https://ejentum.com/pricing.
 */

export {
  createEjentumTools,
  createReasoningTool,
  createCodeTool,
  createAntiDeceptionTool,
  createMemoryTool,
  type EjentumTools,
} from "./tools.js";

export {
  callLogicApi,
  DEFAULT_API_URL,
  DEFAULT_TIMEOUT_MS,
  VALID_MODES,
  type EjentumConfig,
  type HarnessMode,
} from "./api.js";

export const VERSION = "0.1.0";
