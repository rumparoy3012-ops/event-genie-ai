/**
 * EventGenie AI – Domain Type Definitions
 * Hack2Skill PromptWars Challenge 5 – Celebration & Event Planner
 *
 * All interfaces are strict (no `any`, no optional-without-default ambiguity).
 * These types are the single source of truth shared across the math engine,
 * the Gemini service, and every UI component.
 */

// ─── Event Vertical ──────────────────────────────────────────────────────────

/** The three supported event verticals for Challenge 5. */
export type EventType = 'wedding' | 'birthday' | 'community';

/** Human-readable labels for each event type. */
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  wedding: 'Wedding',
  birthday: 'Birthday',
  community: 'Community / Hackathon',
};

// ─── Budget ──────────────────────────────────────────────────────────────────

/**
 * A single line-item inside a budget plan.
 * `allocatedAmount` is always an exact integer cent value to avoid float drift.
 */
export interface BudgetItem {
  /** Descriptive category name, e.g. "Venue & Catering". */
  category: string;
  /** Exact dollar amount allocated to this line item (in the event currency). */
  allocatedAmount: number;
  /** Percentage of totalBudget (0–100). Sum across all items === 100. */
  percentage: number;
  /** Optional planner notes or justification for this allocation. */
  notes: string;
  /** True for non-negotiable line items (e.g. Venue deposit). */
  isMandatory: boolean;
}

/**
 * The complete budget plan for an event.
 * The math engine guarantees: sum(items[].allocatedAmount) === totalBudget
 * with zero rounding drift via the largest-remainder method.
 */
export interface BudgetPlan {
  /** Raw total budget supplied by the planner, in the chosen currency. */
  totalBudget: number;
  /** ISO 4217 currency code, default "USD". */
  currency: string;
  /**
   * The portion of totalBudget reserved as a contingency buffer (5–10%).
   * This is already included as a dedicated BudgetItem; this field surfaces it
   * as a first-class metric for UI display.
   */
  contingencyReserve: number;
  /** Ordered line items. Sum of allocatedAmount === totalBudget. */
  items: BudgetItem[];
  /**
   * Derived metric: totalBudget / guestCount.
   * Recomputed whenever guestCount changes.
   */
  costPerGuest: number;
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

/** Planning phase taxonomy used to group milestone tasks. */
export type MilestonePhase = 'Months Out' | 'Weeks Out' | 'Day of Event';

/**
 * A single actionable task on the event planning timeline.
 * `dueDateOffsetDays` is negative (days before the event date).
 */
export interface MilestoneTask {
  /** Stable UUID-style string, e.g. "w-001". */
  id: string;
  /** Which planning phase this task belongs to. */
  phase: MilestonePhase;
  /** Short action title shown in the checklist. */
  title: string;
  /** Expanded description with actionable guidance. */
  description: string;
  /** Whether the planner has ticked this task off. */
  isCompleted: boolean;
  /**
   * Days before the event date when this task is due.
   * Negative means before; 0 means on the day.
   * Example: -180 === 6 months out.
   */
  dueDateOffsetDays: number;
}

// ─── Vendors ─────────────────────────────────────────────────────────────────

/**
 * A vendor diligence card covering one vendor category.
 * Displayed in the VendorDiligence component.
 */
export interface VendorItem {
  /** Vendor category, e.g. "Photography & Videography". */
  category: string;
  /** Headline title shown on the card. */
  title: string;
  /**
   * Typical market cost range expressed as a human-readable string,
   * e.g. "$2,500 – $6,000".
   * Stored as a string intentionally to allow currency-agnostic formatting.
   */
  benchmarkCostRange: string;
  /** Checklist of concrete deliverables to demand in the contract. */
  deliverables: string[];
  /** Common red flags that signal an unreliable vendor. */
  redFlagsToAvoid: string[];
}

// ─── Master Event Plan ────────────────────────────────────────────────────────

/**
 * The top-level entity produced by the math engine and/or Gemini service.
 * This is the object stored in React state and passed as props throughout
 * the component tree.
 */
export interface EventPlan {
  /** Stable client-generated UUID. */
  id: string;
  /** User-supplied event title, e.g. "Priya & Arjun's Wedding". */
  title: string;
  /** The event vertical. */
  type: EventType;
  /** Number of expected attendees. Must be > 0. */
  guestCount: number;
  /** Total budget in the chosen currency. Must be > 0. */
  totalBudget: number;
  /** Free-text theme idea supplied by the planner. */
  themeIdea: string;
  /** Fully resolved budget plan with exact allocations. */
  budget: BudgetPlan;
  /** Ordered milestone checklist. */
  timeline: MilestoneTask[];
  /** Vendor diligence cards for this event vertical. */
  vendors: VendorItem[];
  /**
   * ISO 8601 timestamp of when this plan was generated.
   * Used for display and cache invalidation.
   */
  generatedAt: string;
  /**
   * Whether this plan was produced by the local deterministic fallback
   * engine (true) or the live Gemini API (false).
   */
  isOfflineFallback: boolean;
}

// ─── Configurator Form State ──────────────────────────────────────────────────

/** Raw form values before validation and plan generation. */
export interface EventFormValues {
  eventType: EventType;
  title: string;
  guestCount: string; // kept as string until validated
  totalBudget: string; // kept as string until validated
  themeIdea: string;
  userNotes: string;
  currency: string;
  geminiApiKey: string; // never stored server-side; only lives in session memory
}

/** A 1-click preset that pre-fills the EventConfigurator form. */
export interface EventPreset {
  label: string;
  icon: string;
  values: Omit<EventFormValues, 'geminiApiKey' | 'userNotes'>;
}

// ─── Conversational Replanner ─────────────────────────────────────────────────

/** A single turn in the conversational replanner chat. */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

/** Result returned by the replanner after processing a user instruction. */
export interface ReplanResult {
  updatedPlan: EventPlan;
  explanation: string;
  changes: string[];
}
