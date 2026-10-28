/**
 * EventGenie AI – Deterministic Budget Calculator
 * Hack2Skill PromptWars Challenge 5
 *
 * This module is intentionally decoupled from any LLM.
 * It uses the largest-remainder method to guarantee that every cent of the
 * totalBudget is allocated with zero floating-point drift.
 *
 * Invariant: sum(plan.items.map(i => i.allocatedAmount)) === totalBudget
 */

import type { BudgetItem, BudgetPlan, EventType } from '../types/event';

// ─── Allocation Profiles ───────────────────────────────────────────────────

/**
 * Internal representation of an allocation slice before dollar math.
 * `rawPct` values MUST sum to exactly 100.
 */
interface AllocationSlice {
  category: string;
  rawPct: number;       // integer percentage 0-100
  notes: string;
  isMandatory: boolean;
}

const WEDDING_PROFILE: AllocationSlice[] = [
  {
    category: 'Venue',
    rawPct: 35,
    notes: 'Ceremony + reception venue hire, caretaker fees, parking.',
    isMandatory: true,
  },
  {
    category: 'Catering',
    rawPct: 30,
    notes: 'Per-plate meals, open bar, dessert station, waitstaff.',
    isMandatory: true,
  },
  {
    category: 'Decor & Attire',
    rawPct: 15,
    notes: 'Floral arrangements, draping, bridal outfit, groom suit.',
    isMandatory: false,
  },
  {
    category: 'Photography & Videography',
    rawPct: 10,
    notes: 'Lead photographer + second shooter, drone footage, edited album.',
    isMandatory: false,
  },
  {
    category: 'Contingency Reserve',
    rawPct: 10,
    notes: 'Safety buffer for last-minute upgrades or vendor price changes.',
    isMandatory: false,
  },
];

const BIRTHDAY_PROFILE: AllocationSlice[] = [
  {
    category: 'Venue & Entertainment',
    rawPct: 35,
    notes: 'Venue hire, DJ / live band, photo booth, activities.',
    isMandatory: true,
  },
  {
    category: 'Food & Drinks',
    rawPct: 35,
    notes: 'Catered buffet or sit-down meal, signature cocktails, soft drinks.',
    isMandatory: true,
  },
  {
    category: 'Cake & Decor',
    rawPct: 15,
    notes: 'Custom cake, balloon arrangements, table centrepieces, lighting.',
    isMandatory: false,
  },
  {
    category: 'Contingency Reserve',
    rawPct: 15,
    notes: 'Buffer for surprise guest counts and ad-hoc purchases.',
    isMandatory: false,
  },
];

const COMMUNITY_PROFILE: AllocationSlice[] = [
  {
    category: 'Venue & Tech Setup',
    rawPct: 40,
    notes: 'Hall/auditorium hire, A/V equipment, Wi-Fi, stage, projectors.',
    isMandatory: true,
  },
  {
    category: 'Food & Logistics',
    rawPct: 35,
    notes: 'Meals, refreshments, transport coordination, volunteer kits.',
    isMandatory: true,
  },
  {
    category: 'Swag & Prizes',
    rawPct: 15,
    notes: 'Hackathon prizes, participation swag, trophies, certificates.',
    isMandatory: false,
  },
  {
    category: 'Contingency Reserve',
    rawPct: 10,
    notes: 'Buffer for unexpected AV failures or late registrations.',
    isMandatory: false,
  },
];

const PROFILES: Record<EventType, AllocationSlice[]> = {
  wedding: WEDDING_PROFILE,
  birthday: BIRTHDAY_PROFILE,
  community: COMMUNITY_PROFILE,
};

// ─── Largest-Remainder Dollar Allocation ──────────────────────────────────

/**
 * Distributes `total` across `slices` using the largest-remainder (Hamilton)
 * method. This guarantees:
 *   1. Every item receives at least floor(total * pct / 100).
 *   2. Exactly (total - sum_of_floors) cents are distributed to the items
 *      with the largest fractional remainders, one cent at a time.
 *   3. sum(results) === total with zero drift.
 *
 * @param total   - Total budget amount (can be fractional dollars).
 * @param slices  - Ordered allocation profiles whose rawPct sums to 100.
 * @returns       - Ordered array of exact dollar amounts parallel to `slices`.
 */
function largestRemainderAllocation(total: number, slices: AllocationSlice[]): number[] {
  // Work in cents to avoid float imprecision
  const totalCents = Math.round(total * 100);

  // Step 1: compute exact fractional cents per slice
  const exactCents = slices.map(s => (s.rawPct / 100) * totalCents);

  // Step 2: floor each allocation
  const floored = exactCents.map(Math.floor);

  // Step 3: compute how many extra cents we need to distribute
  const distributed = floored.reduce((a, b) => a + b, 0);
  let remainder = totalCents - distributed; // always >= 0

  // Step 4: rank by fractional part descending
  const indices = slices
    .map((_, i) => i)
    .sort((a, b) => (exactCents[b] - floored[b]) - (exactCents[a] - floored[a]));

  // Step 5: hand out one extra cent to the top remainder holders
  for (let i = 0; i < remainder; i++) {
    floored[indices[i]] += 1;
  }

  // Step 6: convert back to dollars (keep 2 decimal places)
  return floored.map(c => Math.round(c) / 100);
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Calculates a fully-resolved BudgetPlan for the given event configuration.
 *
 * @param type        - Event vertical: 'wedding' | 'birthday' | 'community'.
 * @param totalBudget - Total planning budget in the chosen currency. Must be > 0.
 * @param guestCount  - Number of expected attendees. Must be > 0.
 * @param currency    - ISO 4217 currency code (default 'USD').
 * @returns           - BudgetPlan with exact allocations and derived metrics.
 * @throws            - Descriptive Error for invalid inputs.
 */
export function calculateEventBudget(
  type: EventType,
  totalBudget: number,
  guestCount: number,
  currency = 'USD',
): BudgetPlan {
  // ── Input Validation ────────────────────────────────────────────────────
  if (!Number.isFinite(totalBudget) || totalBudget <= 0) {
    throw new Error(
      `Invalid totalBudget: "${totalBudget}". Budget must be a positive finite number.`,
    );
  }
  if (!Number.isInteger(guestCount) || guestCount <= 0) {
    throw new Error(
      `Invalid guestCount: "${guestCount}". Guest count must be a positive integer.`,
    );
  }
  if (!(type in PROFILES)) {
    throw new Error(
      `Unknown event type: "${type}". Must be one of: wedding, birthday, community.`,
    );
  }

  const slices = PROFILES[type];
  const allocatedAmounts = largestRemainderAllocation(totalBudget, slices);

  // ── Sanity check (invariant assertion) ─────────────────────────────────
  const sum = allocatedAmounts.reduce((a, b) => a + b, 0);
  const sumCents = Math.round(sum * 100);
  const totalCents = Math.round(totalBudget * 100);
  if (sumCents !== totalCents) {
    // This should never happen; indicates a bug in largestRemainderAllocation.
    throw new Error(
      `Budget allocation invariant violated: expected ${totalBudget}, got ${sum}. ` +
      `Difference: ${totalBudget - sum}. Please file a bug.`,
    );
  }

  // ── Build BudgetItems ───────────────────────────────────────────────────
  const items: BudgetItem[] = slices.map((slice, i) => ({
    category: slice.category,
    allocatedAmount: allocatedAmounts[i],
    percentage: slice.rawPct,
    notes: slice.notes,
    isMandatory: slice.isMandatory,
  }));

  // ── Contingency Reserve (surface as first-class metric) ────────────────
  const contingencyItem = items.find(item =>
    item.category.toLowerCase().includes('contingency'),
  );
  const contingencyReserve = contingencyItem?.allocatedAmount ?? 0;

  return {
    totalBudget,
    currency,
    contingencyReserve,
    items,
    costPerGuest: parseFloat((totalBudget / guestCount).toFixed(2)),
  };
}

// ─── Budget Mutation Helpers (used by ConversationalReplanner) ────────────

/**
 * Returns a new BudgetPlan with `delta` moved from `fromCategory` to `toCategory`.
 * Validates that the source category has sufficient funds.
 *
 * @param plan         - Existing BudgetPlan to mutate (immutable; returns new object).
 * @param fromCategory - Category name to deduct from.
 * @param toCategory   - Category name to credit.
 * @param delta        - Positive amount to transfer.
 * @returns            - New BudgetPlan with adjusted allocations.
 * @throws             - If categories not found or insufficient funds.
 */
export function transferBudget(
  plan: BudgetPlan,
  fromCategory: string,
  toCategory: string,
  delta: number,
): BudgetPlan {
  if (delta <= 0) {
    throw new Error(`Transfer delta must be positive. Got: ${delta}`);
  }

  const newItems: BudgetItem[] = plan.items.map(item => {
    const isFrom = item.category.toLowerCase().includes(fromCategory.toLowerCase());
    const isTo = item.category.toLowerCase().includes(toCategory.toLowerCase());

    if (isFrom && isTo) {
      throw new Error(`fromCategory and toCategory resolve to the same item: "${item.category}".`);
    }
    if (isFrom) {
      if (item.allocatedAmount < delta) {
        throw new Error(
          `Insufficient funds in "${item.category}". Available: ${item.allocatedAmount}, requested: ${delta}.`,
        );
      }
      const newAmount = parseFloat((item.allocatedAmount - delta).toFixed(2));
      return {
        ...item,
        allocatedAmount: newAmount,
        percentage: parseFloat(((newAmount / plan.totalBudget) * 100).toFixed(1)),
      };
    }
    if (isTo) {
      const newAmount = parseFloat((item.allocatedAmount + delta).toFixed(2));
      return {
        ...item,
        allocatedAmount: newAmount,
        percentage: parseFloat(((newAmount / plan.totalBudget) * 100).toFixed(1)),
      };
    }
    return item;
  });

  const contingencyItem = newItems.find(item =>
    item.category.toLowerCase().includes('contingency'),
  );

  return {
    ...plan,
    contingencyReserve: contingencyItem?.allocatedAmount ?? plan.contingencyReserve,
    items: newItems,
  };
}

/**
 * Formats a dollar amount using Intl.NumberFormat for display.
 *
 * @param amount   - Numeric amount.
 * @param currency - ISO 4217 code (default 'USD').
 * @returns        - Formatted string, e.g. "$12,500.00".
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
