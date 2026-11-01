import { describe, it, expect } from "vitest";
import { calculateEventBudget } from "../src/utils/budgetCalculator";

describe("EventGenie Parameter Validation", () => {
  it("maintains strict positive allocations across preset profiles", () => {
    const plan = calculateEventBudget("wedding", 50000, 200);
    expect(plan.items.length).toBeGreaterThanOrEqual(4);
    for (const item of plan.items) {
      expect(item.allocatedAmount).toBeGreaterThan(0);
      expect(item.percentage).toBeGreaterThan(0);
      expect(item.category.length).toBeGreaterThan(0);
    }
  });

  it("preserves mathematical invariants under extreme per-guest divisions", () => {
    const plan = calculateEventBudget("birthday", 999.99, 33);
    const sum = plan.items.reduce((s, i) => s + i.allocatedAmount, 0);
    expect(Math.round(sum * 100) / 100).toBe(999.99);
    expect(plan.costPerGuest).toBe(Math.round((999.99 / 33) * 100) / 100);
  });

  it("prevents subversion of budget bounds with strict throws", () => {
    expect(() => calculateEventBudget("wedding", -5000, 50)).toThrow();
    expect(() => calculateEventBudget("wedding", 5000, -10)).toThrow();
    expect(() => calculateEventBudget("wedding", 5000, 0)).toThrow();
  });
});