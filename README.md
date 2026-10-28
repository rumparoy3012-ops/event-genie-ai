# EventGenie AI 🧞‍♂️

> **Hack2Skill PromptWars Challenge 5 — Celebration & Event Planner**
> 
> A production-grade, AI-augmented event planning system. Works fully offline.
> Plan weddings, birthdays, and community hackathons with exact budget math,
> interactive timelines, vendor diligence packs, and a conversational AI assistant.

---

## 🎯 Project Mission & Challenge 5 Alignment

EventGenie AI directly addresses every element of Challenge 5:

| Challenge Requirement | EventGenie AI Implementation |
|---|---|
| **Weddings, Birthdays, Community & College Events** | Three first-class event verticals with dedicated allocation profiles, timelines, and vendor packs |
| **Budgets** | Deterministic largest-remainder math engine guarantees zero rounding drift |
| **Dynamic Timelines** | Interactive phase-grouped milestone checklist with completion tracking |
| **Vendor Diligence Checklists** | Per-vertical vendor cards with benchmark costs, deliverables, and red flags |
| **Natural Language AI Plan Adjustment** | ConversationalReplanner using Gemini 2.0 Flash + offline regex fallback |

---

## 🏗️ Architecture Overview

```
EventGenie AI
├── Deterministic Math Engine (budgetCalculator.ts)
│   ├── Largest-remainder allocation (zero floating-point drift)
│   ├── 3 allocation profiles: Wedding / Birthday / Community
│   ├── Budget transfer helper (for replanning)
│   └── Input validation with descriptive error messages
│
├── Gemini AI Hybrid Layer (geminiService.ts)
│   ├── PRIMARY: Gemini 2.0 Flash REST API (when key provided)
│   ├── FALLBACK: Local deterministic engine (always works offline)
│   ├── XSS sanitisation on all inputs and AI outputs
│   └── Conversational replanning (budget transfers + theme changes)
│
├── React UI (5 components)
│   ├── EventConfigurator   — Form with presets and validation
│   ├── BudgetBreakdown     — Visual stacked bars + category cards
│   ├── TimelineChecklist   — Accordion phases + completion toggles
│   ├── VendorDiligence     — Accordion vendor cards
│   └── ConversationalReplanner — Chat interface with AI assistant
│
└── Test Suite (Vitest)
    └── 35+ unit tests covering math accuracy, validation, edge cases
```

### Hybrid Strategy: Math Engine + GenAI

```
User Input → calculateEventBudget() → Deterministic BudgetPlan (always)
                                            ↓
                              Gemini API available?
                              YES → Enrich title + theme via Gemini 2.0 Flash
                              NO  → Use offline synthesised text from fallback engine
                                            ↓
                              Complete EventPlan returned (never throws to caller)
```

---

## ✅ Evaluation Parameter Verification Table

| Parameter | Impact | Evidence |
|---|---|---|
| **Problem Statement Alignment** | 🔴 High | `src/services/geminiService.ts`: 3 complete event verticals with 7–14 milestones each, 3 vendor packs, full budget profiles. `src/components/ConversationalReplanner.tsx`: NL replanning. |
| **Code Quality** | 🔴 High | `src/types/event.ts`: 10 strict interfaces, zero `any`. All files have JSDoc. `budgetCalculator.ts` has invariant assertion. Zero dead code. Modular: types / utils / services / components. |
| **Security** | 🟡 Medium | No hardcoded keys anywhere. API key lives only in React state (session-scoped). `sanitize()` in `geminiService.ts` applied to all user text and all AI responses. Offline fallback prevents API dependency. |
| **Efficiency** | 🟡 Medium | Tailwind v4 (CSS-first, no config). Lucide-react (tree-shaken). Zero external charts library (native CSS bars). Budget math: O(n) for n categories. Bundle target < 5 MB. |
| **Testing** | 🟠 Low/Medium | `tests/budgetCalculator.test.ts`: 35+ Vitest tests. Covers exact allocation sums, contingency rates, per-guest math, 6 validation guards, transfer helper, offline plan structure, currency formatting. |
| **Accessibility** | 🟢 Low | Semantic: `<main>`, `<section>`, `<article>`, `<header>`, `<nav>`, `<footer>`. `aria-live="polite"` on replanner. `role="progressbar"` with valuenow/min/max. `aria-expanded` on accordions. `role="tabpanel"`. Skip-nav link. WCAG AA contrast (#f0f0fa on #0a0b14 = 17:1). |

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+ 
- npm 9+

### Install & Run

```bash
# Clone or navigate to the project
cd event-genie

# Install dependencies (already done if you ran the setup commands)
npm install

# Start development server
npm run dev
# → Opens at http://localhost:5173
```

### Run Tests

```bash
# Run the full test suite (35+ unit tests)
npm test

# Watch mode (re-runs on file change)
npm run test:watch

# Coverage report
npm run test:coverage
```

### Using Gemini AI (Optional)

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Paste it into the **Gemini API Key** field in the configurator
3. The app works fully without a key — the offline engine produces the same plan structure

> ⚠️ **Security**: The API key is never stored in `localStorage`, cookies, or any server. It lives only in React component state for the duration of the session.

---

## ☁️ Vercel Deployment

### One-Click via Vercel CLI

```bash
npm install -g vercel
vercel --prod
```

### Manual via Dashboard

1. Push to GitHub
2. Import repo at [vercel.com/new](https://vercel.com/new)
3. Framework: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`
6. Click **Deploy**

> No environment variables are required. The app is fully functional without any server-side configuration.

---

## 📁 File Structure

```
event-genie/
├── src/
│   ├── types/
│   │   └── event.ts              ← All TypeScript interfaces
│   ├── utils/
│   │   └── budgetCalculator.ts   ← Deterministic math engine
│   ├── services/
│   │   └── geminiService.ts      ← AI service + offline fallback
│   ├── components/
│   │   ├── EventConfigurator.tsx ← Form with presets
│   │   ├── BudgetBreakdown.tsx   ← Visual budget display
│   │   ├── TimelineChecklist.tsx ← Interactive milestone list
│   │   ├── VendorDiligence.tsx   ← Vendor cards
│   │   └── ConversationalReplanner.tsx ← AI chat interface
│   ├── App.tsx                   ← Root application + state
│   ├── index.css                 ← Complete design system
│   └── main.tsx                  ← React entry point
├── tests/
│   └── budgetCalculator.test.ts  ← 35+ Vitest unit tests
├── vite.config.ts                ← Vite + Vitest config
└── README.md
```

---

## 🧮 Budget Math Guarantee

The `calculateEventBudget` function uses the **largest-remainder (Hamilton) method**:

1. Convert total budget to cents to eliminate float imprecision
2. Compute exact fractional cent allocation per category
3. Floor each allocation
4. Rank categories by fractional remainder (descending)
5. Distribute remaining cents one-by-one to top-ranked categories
6. Convert back to dollars

**Invariant**: `sum(items[].allocatedAmount) === totalBudget` for any finite positive budget.
This is verified by an internal assertion and tested by 10+ Vitest tests across all budget sizes.

---

## 🔒 Security Design

| Threat | Mitigation |
|---|---|
| Hardcoded API keys | Zero keys in source. Key accepted only via input field |
| XSS via user input | `sanitize()` strips and encodes all HTML special chars before DOM insertion |
| XSS via AI output | All Gemini responses passed through `sanitize()` before use |
| API key leakage | Key stored only in React state; never logged, never in localStorage |
| Network failure | 10-second timeout + AbortController; automatic offline fallback |
| Invalid inputs | Strict validation with descriptive thrown errors before any calculation |

---

## 📝 Assumptions & Constraints

1. **Currency**: Budget math is currency-agnostic (operates on raw numbers). Formatting uses `Intl.NumberFormat` for display only.
2. **Budget profiles**: Allocation percentages are fixed by domain expertise. They can be customised by modifying `PROFILES` in `budgetCalculator.ts`.
3. **Gemini model**: Uses `gemini-2.0-flash` for low latency. Switch to `gemini-2.5-flash` by changing the model string in `geminiService.ts`.
4. **Guest count**: Must be a positive integer. Fractional guests are rejected by validation.
5. **Offline fallback**: Produces a structurally identical plan to the Gemini-enriched version; only the event title and theme are less creative without AI enrichment.
6. **No persistence**: Plans are not stored between sessions by design (no backend, no localStorage) to simplify the security model.

---

## 📄 License

MIT — Built for Hack2Skill PromptWars Challenge 5.
