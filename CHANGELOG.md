# Changelog

All notable changes to `ejentum-ai` are documented here. This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-05-23

### Added

- Initial release.
- `createEjentumTools(config)` factory returns the four Ejentum harness tools as an object keyed by `harness_reasoning`, `harness_code`, `harness_anti_deception`, `harness_memory`. Pass it directly to Vercel AI SDK's `generateText({ tools, ... })` or `streamText({ tools, ... })`.
- Per-tool factories also exported: `createReasoningTool`, `createCodeTool`, `createAntiDeceptionTool`, `createMemoryTool`. Use these when you want to mix individual harnesses with non-Ejentum tools.
- Built on Vercel AI SDK's `tool({ description, parameters, execute })` primitive with Zod schemas for the `query` parameter (single `string`, `min(1)`).
- Native `fetch` (Node 18+) with `AbortController`-based timeout. No dep weight beyond `ai` and `zod` (both peer deps).
- Construction-time and call-time validation: empty/whitespace query returns an actionable error without spending a paid API call. Missing `EJENTUM_API_KEY` returns an actionable error pointing to https://ejentum.com/pricing.
- Errors returned as human-readable strings from `execute` for every failure path (no exceptions cross the tool boundary, so an agent step never crashes the run).
- TypeScript-first with declaration files (`.d.ts`) and source maps. Strict mode enabled.
- Unit tests via vitest cover the call-helper failure surface (missing key, empty/whitespace/non-string query, invalid mode, 401, non-200, invalid JSON, unexpected shape, non-string scaffold, network/abort error) plus the tool factory contract (four named tools, distinct descriptions, callable `execute`).
- Published to npm with `--provenance` provenance attestation via GitHub Actions OIDC.

### Background

Vercel AI SDK's third-party tool convention is freeform: any npm package that exports `tool()` calls or factories returning `Tool` objects from the `ai` package's type. This shim follows the dominant pattern from `@ai-sdk/<provider>` packages: a per-tool factory plus a `createEjentumTools(config)` bundler. Shared config (apiKey, apiUrl, timeoutMs) propagates via closure.

The Ejentum MCP server (`ejentum-mcp`) is also consumable from Vercel AI SDK via `experimental_createMCPClient`. This package is the lighter-deps alternative for users who don't want to spin up an MCP server.
