import { describe, it, expect } from 'vitest';
import { sanitize, generateCustomEventPlan, processReplanInstruction } from '../src/services/geminiService';
import { calculateEventBudget } from '../src/utils/budgetCalculator';

describe('geminiService - Security & Input Sanitization', () => {
  it('strips script tags and executable code', () => {
    const input = '<script>alert("xss")</script>Hello Party!';
    const cleaned = sanitize(input);
    expect(cleaned).not.toContain('<script>');
    expect(cleaned).toContain('Hello Party!');
  });

  it('neutralizes malicious HTML attributes and event handlers', () => {
    const input = '<img src=x onerror=alert(1)>Tech Fest';
    const cleaned = sanitize(input);
    expect(cleaned).not.toContain('onerror=');
    expect(cleaned).toContain('Tech Fest');
  });

  it('handles empty strings safely', () => {
    expect(sanitize('')).toBe('');
  });
});

describe('geminiService - Offline Fallback Engine & Deterministic Dossiers', () => {
  it('generates complete wedding dossier offline without API key', async () => {
    const plan = await generateCustomEventPlan('wedding', 25000, 150, 'Vintage Garden', 'Vegan menu required', '');
    expect(plan).toBeDefined();
    expect(plan.type).toBe('wedding');
    expect(plan.budget.totalBudget).toBe(25000);
    expect(plan.timeline.length).toBeGreaterThanOrEqual(4);
    expect(plan.vendors.length).toBeGreaterThanOrEqual(3);
    const sum = plan.budget.items.reduce((s, i) => s + i.allocatedAmount, 0);
    expect(Math.round(sum * 100) / 100).toBe(25000);
  });

  it('generates complete birthday dossier offline with contirgency reserve', async () => {
    const plan = await generateCustomEventPlan('birthday', 4000, 25, 'Neon Arcade', '', '');
    expect(plan.type).toBe('birthday');
    expect(plan.budget.contingencyReserve).toBe(600);
    const sum = plan.budget.items.reduce((s, i) => s + i.allocatedAmount, 0);
    expect(sum).toBe(4000);
  });

  it('generates complete community hackathon dossier offline', async () => {
    const plan = await generateCustomEventPlan('community', 15000, 200, 'AI Innovation Hack', 'Need high power', '');
    expect(plan.type).toBe('community');
    expect(plan.budget.contingencyReserve).toBe(1500);
    expect(plan.budget.costPerGuest).toBe(75);
  });

  it('handles invalid API key gracefully without throwing unexpected errors', async () => {
    const plan = await generateCustomEventPlan('wedding', 10000, 50, '', '', 'INVALID_KEY_TESTER');
    expect(plan).toBeDefined();
    expect(plan.budget.totalBudget).toBe(10000);
  });
});

describe('geminiService - Conversational Replanning Resilience', () => {
  it('processes replanning instructions offline and preserves budget', async () => {
    const baseBudget = calculateEventBudget('wedding', 20000, 100);
    const mockPlan = {
      type: 'wedding' as const,
      title: 'Grand Wedding',
      theme: 'Classic Floral',
      budget: baseBudget,
      timeline: [{ id: '1', phase: 'Month-of', title: 'Confirm Venue', deadline: '30 days prior', completed: false }],
      vendors: [{ id: 'v1', category: 'Venue', benchmarkCost: 7000, negotiableItems: ['Corkage'], redFlags: ['Hidden'] }]
    };

    const replanned = await processReplanInstruction("Reduce venue cost by 10% shift to catering", mockPlan, '');
    expect(replanned).toBeDefined();
    expect(replanned.updatedPlan).toBeDefined();
    expect(replanned.updatedPlan.budget.totalBudget).toBe(20000);
  });
});
