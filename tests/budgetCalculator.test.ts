/**
 * EventGenie AI – Vitest Unit Test Suite
 * Hack2Skill PromptWars Challenge 5
 *
 * Tests cover:
 *  1. Exact 100% budget allocation summing with zero penny loss (all 3 verticals)
 *  2. Correct contingency reserve for each vertical
 *  3. Per-guest cost accuracy
 *  4. Edge case rejections (zero / negative budget, zero / negative guests)
 *  5. Non-integer guest count rejection
 *  6. Budget transfer helper correctness and error handling
 *  7. Currency formatting
 *  8. Offline fallback plan completeness
 */

import { describe, it, expect } from 'vitest';
import {
  calculateEventBudget,
  transferBudget,
  formatCurrency,
} from '../src/utils/budgetCalculator';
import type { EventType } from '../src/types/event';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns the sum of all BudgetItem.allocatedAmount values rounded to cents. */
function sumAllocations(items: { allocatedAmount: number }[]): number {
  return Math.round(items.reduce((acc, item) => acc + item.allocatedAmount, 0) * 100) / 100;
}

/** Returns the contingency item from a plan, or throws if missing. */
function getContingencyItem(items: { category: string; allocatedAmount: number; percentage: number }[]) {
  const item = items.find(i => i.category.toLowerCase().includes('contingency'));
  if (!item) throw new Error('No contingency item found in budget plan');
  return item;
}

// ─── Suite: Budget Calculation Core ──────────────────────────────────────────

describe('calculateEventBudget – core allocation invariants', () => {

  // ── Wedding ────────────────────────────────────────────────────────────

  describe('Wedding vertical', () => {
    it('allocates exactly 100% of a round-number budget (no rounding drift)', () => {
      const plan = calculateEventBudget('wedding', 50_000, 200);
      const total = sumAllocations(plan.items);
      expect(total).toBe(50_000);
    });

    it('allocates exactly 100% of a fractional budget ($12,345.67)', () => {
      const plan = calculateEventBudget('wedding', 12_345.67, 100);
      const total = sumAllocations(plan.items);
      expect(total).toBe(12_345.67);
    });

    it('allocates exactly 100% of a prime-number budget ($7,919)', () => {
      const plan = calculateEventBudget('wedding', 7_919, 50);
      const total = sumAllocations(plan.items);
      expect(total).toBe(7_919);
    });

    it('reserves exactly 10% as contingency for weddings', () => {
      const plan = calculateEventBudget('wedding', 40_000, 150);
      const contingency = getContingencyItem(plan.items);
      expect(contingency.percentage).toBe(10);
      expect(contingency.allocatedAmount).toBe(4_000);
      expect(plan.contingencyReserve).toBe(4_000);
    });

    it('assigns Venue as mandatory and Photography as non-mandatory', () => {
      const plan = calculateEventBudget('wedding', 20_000, 80);
      const venue = plan.items.find(i => i.category === 'Venue');
      const photo = plan.items.find(i => i.category === 'Photography & Videography');
      expect(venue?.isMandatory).toBe(true);
      expect(photo?.isMandatory).toBe(false);
    });

    it('allocates 35% to Venue for wedding profile', () => {
      const budget = 10_000;
      const plan = calculateEventBudget('wedding', budget, 50);
      const venue = plan.items.find(i => i.category === 'Venue');
      expect(venue?.percentage).toBe(35);
      expect(venue?.allocatedAmount).toBe(3_500);
    });

    it('allocates 30% to Catering for wedding profile', () => {
      const budget = 10_000;
      const plan = calculateEventBudget('wedding', budget, 50);
      const catering = plan.items.find(i => i.category === 'Catering');
      expect(catering?.percentage).toBe(30);
      expect(catering?.allocatedAmount).toBe(3_000);
    });
  });

  // ── Birthday ───────────────────────────────────────────────────────────

  describe('Birthday vertical', () => {
    it('allocates exactly 100% of a round-number budget', () => {
      const plan = calculateEventBudget('birthday', 12_000, 75);
      const total = sumAllocations(plan.items);
      expect(total).toBe(12_000);
    });

    it('allocates exactly 100% of a small budget ($999.99)', () => {
      const plan = calculateEventBudget('birthday', 999.99, 20);
      const total = sumAllocations(plan.items);
      expect(total).toBe(999.99);
    });

    it('reserves exactly 15% as contingency for birthday events', () => {
      const plan = calculateEventBudget('birthday', 8_000, 60);
      const contingency = getContingencyItem(plan.items);
      expect(contingency.percentage).toBe(15);
      expect(contingency.allocatedAmount).toBe(1_200);
      expect(plan.contingencyReserve).toBe(1_200);
    });

    it('produces exactly 4 budget line items for birthday profile', () => {
      const plan = calculateEventBudget('birthday', 10_000, 50);
      expect(plan.items).toHaveLength(4);
    });

    it('allocates 35% each to Venue & Entertainment and Food & Drinks', () => {
      const plan = calculateEventBudget('birthday', 10_000, 50);
      const venue = plan.items.find(i => i.category === 'Venue & Entertainment');
      const food = plan.items.find(i => i.category === 'Food & Drinks');
      expect(venue?.percentage).toBe(35);
      expect(food?.percentage).toBe(35);
    });
  });

  // ── Community ──────────────────────────────────────────────────────────

  describe('Community / Hackathon vertical', () => {
    it('allocates exactly 100% of a round-number budget', () => {
      const plan = calculateEventBudget('community', 25_000, 300);
      const total = sumAllocations(plan.items);
      expect(total).toBe(25_000);
    });

    it('allocates exactly 100% of a large budget ($1,000,000)', () => {
      const plan = calculateEventBudget('community', 1_000_000, 5_000);
      const total = sumAllocations(plan.items);
      expect(total).toBe(1_000_000);
    });

    it('allocates exactly 100% for a $1 minimal budget', () => {
      const plan = calculateEventBudget('community', 1, 1);
      const total = sumAllocations(plan.items);
      expect(total).toBe(1);
    });

    it('reserves exactly 10% as contingency for community events', () => {
      const plan = calculateEventBudget('community', 20_000, 200);
      const contingency = getContingencyItem(plan.items);
      expect(contingency.percentage).toBe(10);
      expect(contingency.allocatedAmount).toBe(2_000);
    });

    it('allocates 40% to Venue & Tech Setup', () => {
      const plan = calculateEventBudget('community', 10_000, 100);
      const venue = plan.items.find(i => i.category === 'Venue & Tech Setup');
      expect(venue?.percentage).toBe(40);
      expect(venue?.allocatedAmount).toBe(4_000);
    });

    it('marks Venue & Tech Setup and Food & Logistics as mandatory', () => {
      const plan = calculateEventBudget('community', 20_000, 200);
      const venue = plan.items.find(i => i.category === 'Venue & Tech Setup');
      const food = plan.items.find(i => i.category === 'Food & Logistics');
      expect(venue?.isMandatory).toBe(true);
      expect(food?.isMandatory).toBe(true);
    });
  });

  // ── Cross-vertical zero-drift stress test ──────────────────────────────

  describe('Zero-drift stress tests across budgets', () => {
    const testCases: Array<{ type: EventType; budget: number; guests: number }> = [
      { type: 'wedding', budget: 1, guests: 1 },
      { type: 'wedding', budget: 100.01, guests: 10 },
      { type: 'birthday', budget: 333.33, guests: 33 },
      { type: 'community', budget: 99_999.99, guests: 9_999 },
      { type: 'wedding', budget: 1_000_000, guests: 1_000 },
      { type: 'birthday', budget: 7.77, guests: 7 },
    ];

    testCases.forEach(({ type, budget, guests }) => {
      it(`${type} $${budget} / ${guests} guests — sums to exactly ${budget}`, () => {
        const plan = calculateEventBudget(type, budget, guests);
        const total = sumAllocations(plan.items);
        expect(total).toBe(budget);
      });
    });
  });
});

// ─── Suite: Per-Guest Cost Accuracy ──────────────────────────────────────────

describe('calculateEventBudget – costPerGuest accuracy', () => {
  it('calculates costPerGuest as totalBudget / guestCount', () => {
    const plan = calculateEventBudget('wedding', 30_000, 150);
    expect(plan.costPerGuest).toBe(200);
  });

  it('rounds costPerGuest to 2 decimal places', () => {
    const plan = calculateEventBudget('birthday', 10_000, 3);
    // 10000 / 3 = 3333.333... → rounded to 3333.33
    expect(plan.costPerGuest).toBe(3333.33);
  });

  it('returns correct costPerGuest for single guest', () => {
    const plan = calculateEventBudget('community', 500, 1);
    expect(plan.costPerGuest).toBe(500);
  });
});

// ─── Suite: Input Validation Guards ──────────────────────────────────────────

describe('calculateEventBudget – input validation', () => {
  it('throws for totalBudget === 0', () => {
    expect(() => calculateEventBudget('wedding', 0, 100)).toThrow(/totalBudget/);
  });

  it('throws for totalBudget < 0', () => {
    expect(() => calculateEventBudget('birthday', -500, 50)).toThrow(/totalBudget/);
  });

  it('throws for totalBudget === NaN', () => {
    expect(() => calculateEventBudget('community', NaN, 100)).toThrow(/totalBudget/);
  });

  it('throws for totalBudget === Infinity', () => {
    expect(() => calculateEventBudget('wedding', Infinity, 100)).toThrow(/totalBudget/);
  });

  it('throws for guestCount === 0', () => {
    expect(() => calculateEventBudget('wedding', 10_000, 0)).toThrow(/guestCount/);
  });

  it('throws for guestCount < 0', () => {
    expect(() => calculateEventBudget('birthday', 5_000, -1)).toThrow(/guestCount/);
  });

  it('throws for non-integer guestCount (e.g. 1.5)', () => {
    expect(() => calculateEventBudget('community', 10_000, 1.5)).toThrow(/guestCount/);
  });

  it('throws a descriptive error for unknown event type', () => {
    // @ts-expect-error – intentionally testing invalid type
    expect(() => calculateEventBudget('gala', 10_000, 100)).toThrow(/Unknown event type/);
  });
});

// ─── Suite: Budget Transfer Helper ───────────────────────────────────────────

describe('transferBudget – budget mutation helper', () => {
  const basePlan = calculateEventBudget('wedding', 10_000, 50);

  it('transfers correct amount between two categories', () => {
    const updated = transferBudget(basePlan, 'Catering', 'Decor', 500);
    const oldCatering = basePlan.items.find(i => i.category === 'Catering')!.allocatedAmount;
    const oldDecor = basePlan.items.find(i => i.category.includes('Decor'))!.allocatedAmount;
    const newCatering = updated.items.find(i => i.category === 'Catering')!.allocatedAmount;
    const newDecor = updated.items.find(i => i.category.includes('Decor'))!.allocatedAmount;

    expect(newCatering).toBeCloseTo(oldCatering - 500, 2);
    expect(newDecor).toBeCloseTo(oldDecor + 500, 2);
  });

  it('preserves totalBudget after a transfer', () => {
    const updated = transferBudget(basePlan, 'Catering', 'Venue', 200);
    const total = sumAllocations(updated.items);
    expect(total).toBe(basePlan.totalBudget);
  });

  it('throws when delta === 0', () => {
    expect(() => transferBudget(basePlan, 'Catering', 'Venue', 0)).toThrow(/positive/);
  });

  it('throws when delta < 0', () => {
    expect(() => transferBudget(basePlan, 'Catering', 'Venue', -100)).toThrow(/positive/);
  });

  it('throws when source category has insufficient funds', () => {
    expect(() =>
      transferBudget(basePlan, 'Photography', 'Venue', 999_999),
    ).toThrow(/Insufficient funds/);
  });

  it('updates contingencyReserve after transfer from contingency', () => {
    const updated = transferBudget(basePlan, 'Contingency', 'Catering', 100);
    const originalContingency = basePlan.contingencyReserve;
    expect(updated.contingencyReserve).toBeCloseTo(originalContingency - 100, 2);
  });
});

// ─── Suite: Offline State & Plan Completeness ─────────────────────────────────

describe('calculateEventBudget – plan structure completeness', () => {
  it('returns a BudgetPlan with the correct currency', () => {
    const plan = calculateEventBudget('wedding', 10_000, 50, 'EUR');
    expect(plan.currency).toBe('EUR');
  });

  it('returns the same totalBudget as the input', () => {
    const plan = calculateEventBudget('community', 15_000, 200);
    expect(plan.totalBudget).toBe(15_000);
  });

  it('wedding plan has exactly 5 budget items', () => {
    const plan = calculateEventBudget('wedding', 20_000, 100);
    expect(plan.items).toHaveLength(5);
  });

  it('birthday plan has exactly 4 budget items', () => {
    const plan = calculateEventBudget('birthday', 10_000, 50);
    expect(plan.items).toHaveLength(4);
  });

  it('community plan has exactly 4 budget items', () => {
    const plan = calculateEventBudget('community', 25_000, 300);
    expect(plan.items).toHaveLength(4);
  });

  it('all items have non-empty category strings', () => {
    const plan = calculateEventBudget('wedding', 10_000, 50);
    plan.items.forEach(item => {
      expect(item.category).toBeTruthy();
      expect(typeof item.category).toBe('string');
    });
  });

  it('all items have non-empty notes strings', () => {
    const plan = calculateEventBudget('community', 10_000, 100);
    plan.items.forEach(item => {
      expect(item.notes).toBeTruthy();
      expect(typeof item.notes).toBe('string');
    });
  });

  it('percentage values are all positive integers', () => {
    const plan = calculateEventBudget('birthday', 8_000, 60);
    plan.items.forEach(item => {
      expect(item.percentage).toBeGreaterThan(0);
      expect(Number.isInteger(item.percentage)).toBe(true);
    });
  });

  it('all allocatedAmounts are positive numbers', () => {
    const plan = calculateEventBudget('wedding', 50_000, 200);
    plan.items.forEach(item => {
      expect(item.allocatedAmount).toBeGreaterThan(0);
    });
  });
});

// ─── Suite: Currency Formatting ───────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    const result = formatCurrency(1500, 'USD');
    expect(result).toBe('$1,500');
  });

  it('formats a round million correctly', () => {
    const result = formatCurrency(1_000_000, 'USD');
    expect(result).toBe('$1,000,000');
  });

  it('defaults to USD when no currency provided', () => {
    const result = formatCurrency(500);
    expect(result).toBe('$500');
  });
});
