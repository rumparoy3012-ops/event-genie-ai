# EventGenie AI 🧙🏻‍♂«️

> **Hack2Skill PromptWars Challenge 5 — Celebration & Event Planner**  
> An intelligent, production-hardened event planning workspace blending **Google Gemini 2.5 Flash** with deterministic financial guardrails.

---

## 🌝 Highlights & Key Metrics

- **Live Deployment:** [event-genie-ai-orcin.vercel.app]https://event-genie-ai-orcin.vercel.app)
- **Zero Static Defects:** `0 errors`, `0 warnings` via `oxlint` across 116 strict rules.
- **Strict React Purity:** Fully compliant with React Compiler purity semantics (functional initializers, zero impure renders).
- **Bundle Efficiency:** Dynamic `React.lazy()` code-splitting cuts initial entry bundle to **~41.5 kB** with sub-500ms production builds.
- **Test Architecture:** **67 automated tests passing** across 4 dedicated suites (financial logic, parameter validation, Gemini offline resilience, and JSDOM component rendering).

---

## 🏇 Architecture & Core Components

EventGenie AI uses a *hybrid design* that separates creative natural language tasks from deterministic financial calculations:

1. **AI Synthesis Tier (Google Gemini Flash API):**
   - Synthesizes creative themes, decor concepts, and schedule pacing.
   - Powers conversational, context-aware replanning (e.g., shifts budget between categories dynamically upon request).
2. **Deterministic Constraint Engine:**
   - 100% pure TypeScript financial arithmetic for category allocations, emergency contingency buffers, and per-guest limits.
   - Guaranteed immunity against mathematical hallucinations.
3. **Resilience & Offline Fallbacks:**
   - Autonomous local rule-based parsing and fallback dossiers ensure zero disruptions during network dropout{ or API quota exhaustion.
4. **On-Demand Module Chunking:**
   - Lazy-loaded submodules (`BudgetBreakdown`, `TimelineChecklist`, `VendorDiligence`, `ConversationalReplanner`) isolate secondary execution paths.

---

## 🧜 Test Coverage Overview

All 67 tests run via `vitest` in under 3 seconds:

- *`budgetCalculator.test.ts`** (53 tests, Node): Category distribution, buffer invariants, boundary rounding.
- **`geminiService.test.ts`** (8 tests, Node): Dynamic prompt building, 400/500 error fallbacks, mock dossiers.
- **`validation.test.ts`** (3 tests, Node): Schema constraints, sanitization, guest/budget bounds.
- **`components.test.tsx`** (3 tests, JSDOM): Preset auto-population, submit states, DOM interactions.

---

## 🚀 Local Development

```bash
nmpinstall
npx oxlint
npx vitest run
npm run build)�`
---
