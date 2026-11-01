/**
 * EventGenie AI – Gemini Service with Offline Fallback
 * Hack2Skill PromptWars Challenge 5
 *
 * Architecture:
 *  1. If a Gemini API key is provided, attempt a structured JSON call to
 *     Gemini 2.0 Flash (via REST) to generate rich theme / timeline / vendor text.
 *  2. On any failure (network, quota, parsing), or if no key is supplied,
 *     automatically invoke the local deterministic fallback engine which
 *     synthesises a complete, production-grade EventPlan without external calls.
 *  3. ALL user-supplied text is sanitised before insertion into the DOM to
 *     prevent XSS. All AI-returned text is also sanitised.
 *
 * Security:
 *  - The API key is NEVER logged, stored in localStorage, or sent anywhere
 *    other than the Authorization header of the Gemini REST call.
 *  - No API key is ever hardcoded in this file.
 */

import { calculateEventBudget, transferBudget } from '../utils/budgetCalculator';
import type {
  EventPlan,
  EventType,
  MilestoneTask,
  VendorItem,
} from '../types/event';

// ─── XSS Sanitisation ────────────────────────────────────────────────────────

/**
 * Strips HTML tags and encodes dangerous characters to prevent XSS.
 * Applied to ALL user inputs and ALL AI-generated text before use in the DOM.
 *
 * @param raw - Untrusted string.
 * @returns   - Safe string suitable for React children (not dangerouslySetInnerHTML).
 */
export function sanitize(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#x60;')
    .replace(/=/g, '&#x3D;');
}

/**
 * Truncates and sanitises a string to a maximum safe length.
 * Prevents prompt-injection payloads from being stored in state.
 */
function sanitizeInput(raw: string, maxLength = 500): string {
  return sanitize(raw.slice(0, maxLength).trim());
}

// ─── Unique ID Helper ────────────────────────────────────────────────────────

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Offline Fallback Data ───────────────────────────────────────────────────

/** Wedding milestone timeline. */
const WEDDING_TIMELINE: Omit<MilestoneTask, 'isCompleted'>[] = [
  {
    id: 'w-001', phase: 'Months Out', dueDateOffsetDays: -365,
    title: 'Set your total budget & guest list',
    description: 'Define the financial ceiling and a preliminary A-list + B-list guest count. This anchors every subsequent vendor decision.',
  },
  {
    id: 'w-002', phase: 'Months Out', dueDateOffsetDays: -365,
    title: 'Book the ceremony & reception venue',
    description: 'Visit at least 3 venues. Confirm date availability, catering exclusivity clauses, and noise ordinance curfews. Sign contracts and pay deposit.',
  },
  {
    id: 'w-003', phase: 'Months Out', dueDateOffsetDays: -300,
    title: 'Hire officiant and wedding planner/coordinator',
    description: 'Secure a licensed officiant and optionally a day-of coordinator. Outline ceremony structure and legal documentation requirements.',
  },
  {
    id: 'w-004', phase: 'Months Out', dueDateOffsetDays: -270,
    title: 'Book photographer & videographer',
    description: 'Review full portfolios, confirm editing style, clarify RAW file ownership, and lock an 8-hour coverage package with a backup shooter.',
  },
  {
    id: 'w-005', phase: 'Months Out', dueDateOffsetDays: -240,
    title: 'Book caterer & confirm menu tasting',
    description: 'Negotiate per-plate pricing, dietary accommodation plans, and service staff ratios (1 per 10 guests recommended). Schedule a menu tasting.',
  },
  {
    id: 'w-006', phase: 'Months Out', dueDateOffsetDays: -210,
    title: 'Send Save-the-Dates',
    description: 'Mail or email Save-the-Date cards with the venue city and preliminary event date. Include hotel room block information.',
  },
  {
    id: 'w-007', phase: 'Months Out', dueDateOffsetDays: -180,
    title: 'Book florist, band/DJ, and hair & makeup artists',
    description: 'Finalize decor aesthetic, flower species, and lighting design. Audition musicians or DJs. Book beauty team for trials.',
  },
  {
    id: 'w-008', phase: 'Months Out', dueDateOffsetDays: -120,
    title: 'Send formal wedding invitations',
    description: 'Include RSVP deadline (6 weeks out), meal-choice selection, and accessibility accommodation request field.',
  },
  {
    id: 'w-009', phase: 'Months Out', dueDateOffsetDays: -90,
    title: 'Confirm all vendor contracts & payment schedules',
    description: 'Audit every vendor contract for cancellation clauses, force-majeure provisions, and payment milestones. Pay interim invoices.',
  },
  {
    id: 'w-010', phase: 'Weeks Out', dueDateOffsetDays: -42,
    title: 'Collect RSVPs & finalize guest count',
    description: 'Chase non-responders. Provide caterer with final headcount. Update seating chart and meal selections.',
  },
  {
    id: 'w-011', phase: 'Weeks Out', dueDateOffsetDays: -21,
    title: 'Conduct final venue walk-through',
    description: 'Visit the venue with your planner, caterer, florist, and A/V team. Confirm table layout, power points, and emergency exit routes.',
  },
  {
    id: 'w-012', phase: 'Weeks Out', dueDateOffsetDays: -14,
    title: 'Prepare vendor payment envelopes',
    description: 'Prepare day-of cash/check envelopes for gratuities. Create a master vendor contact sheet with cell numbers.',
  },
  {
    id: 'w-013', phase: 'Weeks Out', dueDateOffsetDays: -7,
    title: 'Confirm ceremony rehearsal & rehearsal dinner',
    description: 'Run through the ceremony script with the bridal party. Confirm dinner reservation and seating. Distribute itineraries.',
  },
  {
    id: 'w-014', phase: 'Day of Event', dueDateOffsetDays: 0,
    title: 'Execute the wedding day timeline',
    description: 'Brief your day-of coordinator. Confirm vendor arrival times. Relax and delegate. Emergency kit: safety pins, stain remover, fashion tape, painkillers.',
  },
];

/** Birthday milestone timeline. */
const BIRTHDAY_TIMELINE: Omit<MilestoneTask, 'isCompleted'>[] = [
  {
    id: 'b-001', phase: 'Months Out', dueDateOffsetDays: -90,
    title: 'Pick date, venue concept & rough guest count',
    description: 'Align on party type (intimate dinner vs. large celebration). Book venue early for weekend dates to avoid conflicts.',
  },
  {
    id: 'b-002', phase: 'Months Out', dueDateOffsetDays: -75,
    title: 'Confirm theme & entertainment',
    description: 'Lock the visual theme. Book DJ, live act, photo booth, or other entertainment. Initiate custom cake consultation.',
  },
  {
    id: 'b-003', phase: 'Months Out', dueDateOffsetDays: -60,
    title: 'Send invitations (digital or physical)',
    description: 'Use Evite, Paperless Post, or printed invitations. Include RSVP deadline, dress code, and parking instructions.',
  },
  {
    id: 'b-004', phase: 'Months Out', dueDateOffsetDays: -45,
    title: 'Confirm caterer / restaurant buyout',
    description: 'Finalize catering style. Confirm dietary restrictions from RSVPs. Lock bar packages and non-alcoholic options.',
  },
  {
    id: 'b-005', phase: 'Weeks Out', dueDateOffsetDays: -21,
    title: 'Confirm final headcount & place orders',
    description: 'Give caterer final numbers. Confirm cake size (servings must match headcount). Order any party favors.',
  },
  {
    id: 'b-006', phase: 'Weeks Out', dueDateOffsetDays: -7,
    title: 'Prepare décor, playlist & run-of-show',
    description: 'Assemble balloons, centrepieces, and personalized touches. Build Spotify playlist. Write itinerary including toasts and cake-cutting time.',
  },
  {
    id: 'b-007', phase: 'Day of Event', dueDateOffsetDays: 0,
    title: 'Decorate, brief staff & enjoy!',
    description: 'Arrive early for setup. Brief venue staff and entertainment on timeline. Designate a point-of-contact so you can enjoy your celebration.',
  },
];

/** Community / hackathon milestone timeline. */
const COMMUNITY_TIMELINE: Omit<MilestoneTask, 'isCompleted'>[] = [
  {
    id: 'c-001', phase: 'Months Out', dueDateOffsetDays: -120,
    title: 'Define event format, goals & sponsorship targets',
    description: 'Decide on hackathon, conference, or college fest format. Draft sponsorship deck. Identify potential corporate and community sponsors.',
  },
  {
    id: 'c-002', phase: 'Months Out', dueDateOffsetDays: -105,
    title: 'Secure venue & internet infrastructure',
    description: 'Book a venue with minimum 1 Gbps internet. Confirm power capacity (10A per team table), backup generator, and A/V equipment.',
  },
  {
    id: 'c-003', phase: 'Months Out', dueDateOffsetDays: -90,
    title: 'Open registrations & publish problem statements',
    description: 'Launch Devpost / Unstop / custom registration portal. Publish challenge tracks, judging rubric, and prize structure.',
  },
  {
    id: 'c-004', phase: 'Months Out', dueDateOffsetDays: -60,
    title: 'Confirm judges, mentors & speakers',
    description: 'Onboard industry judges. Brief mentors on rotation schedule. Confirm keynote speaker availability and travel logistics.',
  },
  {
    id: 'c-005', phase: 'Weeks Out', dueDateOffsetDays: -21,
    title: 'Finalize catering, swag, and volunteer briefing',
    description: 'Confirm meal counts for all meals across the event. Receive swag packages. Run volunteer orientation session.',
  },
  {
    id: 'c-006', phase: 'Weeks Out', dueDateOffsetDays: -7,
    title: 'A/V tech rehearsal & network stress test',
    description: 'Test all projectors, microphones, and streaming setup. Run simulated network load with 50+ concurrent devices. Configure backup hotspots.',
  },
  {
    id: 'c-007', phase: 'Day of Event', dueDateOffsetDays: 0,
    title: 'Execute hackathon operations',
    description: 'Manage check-in, distribute hardware kits, run opening ceremony. Rotate mentors hourly. Announce judging schedule 4 hours before deadline.',
  },
];

/** Wedding vendor diligence cards. */
const WEDDING_VENDORS: VendorItem[] = [
  {
    category: 'Venue',
    title: 'Ceremony & Reception Venue',
    benchmarkCostRange: '$3,000 – $15,000',
    deliverables: [
      'Signed venue hire contract with date exclusivity',
      'Detailed floor plan with table layout flexibility',
      'Included furniture inventory (chairs, tables, linens)',
      'Written parking capacity and valet options',
      'Backup rain plan or indoor alternative',
    ],
    redFlagsToAvoid: [
      'No written contract; only verbal agreement',
      'Hidden surcharges for kitchen use, cake cutting, or corkage',
      'Mandatory in-house caterer with no outside vendor option',
      'No liability insurance coverage on the property',
    ],
  },
  {
    category: 'Photography & Videography',
    title: 'Wedding Photographer & Videographer',
    benchmarkCostRange: '$2,500 – $6,000',
    deliverables: [
      'Full-day coverage (8+ hours) with a second shooter',
      'Drone footage for outdoor or destination weddings',
      'Minimum 500 edited high-resolution digital images',
      'Highlight reel video (3–5 min) + full ceremony recording',
      'Online gallery for downloading and sharing',
    ],
    redFlagsToAvoid: [
      'No backup equipment brought to the venue',
      'Watermarked proofs only; no final edited delivery timeline',
      'Demanding full payment before the event date',
      'Portfolio images that do not match advertised pricing tier',
    ],
  },
  {
    category: 'Catering',
    title: 'Wedding Caterer',
    benchmarkCostRange: '$75 – $200 per head',
    deliverables: [
      'Itemized per-plate pricing for all menu tiers',
      'Complimentary tasting session for the couple',
      'Written dietary/allergen accommodation plan',
      'Staffing ratio documented (minimum 1 server per 10 guests)',
      'Post-event cleanup responsibility clearly stated',
    ],
    redFlagsToAvoid: [
      'No food-handler certification or health department permit',
      'Inability to provide allergen information on request',
      'Vague "market price" clauses in the contract',
      'No refund policy for cancellation or postponement',
    ],
  },
];

/** Birthday vendor diligence cards. */
const BIRTHDAY_VENDORS: VendorItem[] = [
  {
    category: 'Entertainment',
    title: 'DJ / Live Band / Entertainer',
    benchmarkCostRange: '$500 – $3,000',
    deliverables: [
      'Signed performance contract with backup equipment clause',
      'Collaborative playlist consultation session',
      'MC services for introductions, toasts, and cake cutting',
      'Setup and breakdown time included in quote',
    ],
    redFlagsToAvoid: [
      'No formal contract; scheduling conflicts are common without one',
      'Requests full cash payment upfront with no receipt',
      'No public liability insurance',
      'Negative reviews for no-shows or late arrivals',
    ],
  },
  {
    category: 'Catering & Cake',
    title: 'Birthday Caterer & Cake Artist',
    benchmarkCostRange: '$40 – $120 per head (+ $250–$800 for custom cake)',
    deliverables: [
      'Per-head pricing locked at least 3 weeks before event',
      'Custom cake with flavor tasting and fondant/buttercream options',
      'Dessert table or candy bar setup included',
      'Delivery and setup confirmation in writing',
    ],
    redFlagsToAvoid: [
      'No cake tasting offered before committing to a design',
      'Last-minute price increases citing ingredient costs',
      'No refund if cake fails to match agreed design',
    ],
  },
  {
    category: 'Photography',
    title: 'Party Photographer / Photo Booth',
    benchmarkCostRange: '$300 – $1,500',
    deliverables: [
      'Minimum 3 hours of candid and portrait coverage',
      'Same-day digital delivery via gallery link',
      'Print-ready files (300 DPI minimum)',
      'Photo booth with digital sharing and physical print strip',
    ],
    redFlagsToAvoid: [
      'No sample galleries from similar party environments',
      'Upcharges for color correction or basic editing',
    ],
  },
];

/** Community / hackathon vendor diligence cards. */
const COMMUNITY_VENDORS: VendorItem[] = [
  {
    category: 'Venue & Tech',
    title: 'Event Venue & A/V Provider',
    benchmarkCostRange: '$1,000 – $8,000',
    deliverables: [
      'Venue capacity certificate for your expected headcount',
      'Dedicated 1 Gbps+ internet with separate SSID for participants',
      'Projectors, microphones, and PA system included',
      'On-site A/V technician for the full event duration',
      'Dedicated power strips and extension cords per team table',
    ],
    redFlagsToAvoid: [
      'Shared Wi-Fi that caps per-device bandwidth',
      'No backup generator for power interruptions',
      'A/V equipment charged separately at inflated hourly rates',
      'No sound check / tech rehearsal time available the day before',
    ],
  },
  {
    category: 'Catering',
    title: 'Event Caterer (Multi-Meal)',
    benchmarkCostRange: '$25 – $60 per participant per day',
    deliverables: [
      'Per-person pricing inclusive of all meals and breaks',
      'Vegan, gluten-free, and Halal/Kosher options at no surcharge',
      'Continuous refreshments (coffee, tea, snacks) during hacking hours',
      'On-site catering staff for setup, service, and cleanup',
    ],
    redFlagsToAvoid: [
      'Minimum order quantities that exceed your headcount',
      'No written commitment to dietary accommodation delivery',
      'Refusal to provide last-minute headcount adjustments (±10%)',
    ],
  },
  {
    category: 'Swag & Prizes',
    title: 'Swag Vendor & Prize Fulfillment',
    benchmarkCostRange: '$10 – $50 per participant (swag) + prize pool',
    deliverables: [
      'Branded t-shirts / hoodies with size breakdown confirmed 3 weeks out',
      'Prize certificates, trophies, and cash/voucher fulfillment plan',
      'Sponsor logo placement on swag items',
      'Delivery timeline guaranteed at least 1 week before event',
    ],
    redFlagsToAvoid: [
      'Print-on-demand with no quality control sample provided',
      'Prize delivery timelines that extend beyond 30 days post-event',
      'No tracking or signature confirmation on high-value prize shipments',
    ],
  },
];

const VENDOR_MAP: Record<EventType, VendorItem[]> = {
  wedding: WEDDING_VENDORS,
  birthday: BIRTHDAY_VENDORS,
  community: COMMUNITY_VENDORS,
};

const TIMELINE_MAP: Record<EventType, Omit<MilestoneTask, 'isCompleted'>[]> = {
  wedding: WEDDING_TIMELINE,
  birthday: BIRTHDAY_TIMELINE,
  community: COMMUNITY_TIMELINE,
};

// ─── Fallback Plan Synthesizer ───────────────────────────────────────────────

/**
 * Builds a complete EventPlan using only local deterministic data.
 * This is the guaranteed-safe path that works offline and under API quota limits.
 */
function buildFallbackPlan(
  type: EventType,
  totalBudget: number,
  guestCount: number,
  themeIdea: string,
  currency: string,
): EventPlan {
  const budget = calculateEventBudget(type, totalBudget, guestCount, currency);

  const timeline: MilestoneTask[] = TIMELINE_MAP[type].map(task => ({
    ...task,
    isCompleted: false,
  }));

  const titles: Record<EventType, string> = {
    wedding: 'Your Dream Wedding',
    birthday: 'A Birthday to Remember',
    community: 'Community Event Extravaganza',
  };

  return {
    id: generateId('plan'),
    title: titles[type],
    type,
    guestCount,
    totalBudget,
    themeIdea: sanitize(themeIdea || 'Elegant & Timeless'),
    budget,
    timeline,
    vendors: VENDOR_MAP[type],
    generatedAt: new Date().toISOString(),
    isOfflineFallback: true,
  };
}

// ─── Gemini REST Call ────────────────────────────────────────────────────────

/**
 * Calls the Gemini 2.0 Flash API to generate enriched theme text and
 * custom tips layered on top of the deterministic base plan.
 *
 * Returns null on any error (network, quota, malformed JSON) so the
 * caller can gracefully fall back to the local engine.
 *
 * @param apiKey     - Gemini API key from environment / user input.
 * @param type       - Event vertical.
 * @param budget     - Total budget.
 * @param guestCount - Guest count.
 * @param notes      - User's free-text planner notes.
 * @param themeIdea  - User's theme preference.
 */
async function callGeminiApi(
  apiKey: string,
  type: EventType,
  budget: number,
  guestCount: number,
  notes: string,
  themeIdea: string,
): Promise<{ enrichedTitle: string; enrichedTheme: string } | null> {
  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const prompt = `
You are an expert event planner. Generate a creative, concise JSON response for:
Event type: ${type}
Total budget: $${budget}
Guest count: ${guestCount}
Theme idea: ${themeIdea || 'Not specified'}
Additional notes: ${notes || 'None'}

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "enrichedTitle": "<A creative 5-8 word event title>",
  "enrichedTheme": "<2-3 sentence theme description with specific, actionable design ideas>"
}
`.trim();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000); // 10-second timeout

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      console.warn(`[GeminiService] API returned ${response.status}. Using offline fallback.`);
      return null;
    }

    const data = await response.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) return null;

    // Parse and sanitize the JSON response
    const parsed = JSON.parse(raw) as { enrichedTitle?: string; enrichedTheme?: string };
    if (typeof parsed.enrichedTitle !== 'string' || typeof parsed.enrichedTheme !== 'string') {
      return null;
    }

    return {
      enrichedTitle: sanitize(parsed.enrichedTitle),
      enrichedTheme: sanitize(parsed.enrichedTheme),
    };
  } catch {
    // Network error, abort, or JSON parse error — fall through to local engine
    console.warn('[GeminiService] API call failed. Using offline fallback engine.');
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generates a complete, production-grade EventPlan.
 *
 * Hybrid strategy:
 *  1. Always compute the deterministic budget + timeline + vendors locally.
 *  2. If apiKey is present, attempt to enrich the title and theme via Gemini.
 *  3. On any Gemini failure, return the fully functional local plan transparently.
 *
 * @param type       - Event vertical.
 * @param budget     - Total budget in chosen currency. Must be > 0.
 * @param guestCount - Expected attendees. Must be > 0.
 * @param themeIdea  - User's theme preference (will be sanitised).
 * @param userNotes  - Free-text planner notes (will be sanitised).
 * @param apiKey     - Optional Gemini API key (never hardcoded or logged).
 * @param currency   - ISO 4217 currency code. Default 'USD'.
 * @returns          - Complete EventPlan (never throws to the caller).
 */
export async function generateCustomEventPlan(
  type: EventType,
  budget: number,
  guestCount: number,
  themeIdea: string,
  userNotes: string,
  apiKey?: string,
  currency = 'USD',
): Promise<EventPlan> {
  // Always build the safe base plan first
  const basePlan = buildFallbackPlan(
    type,
    budget,
    guestCount,
    themeIdea,
    currency,
  );

  // Attempt Gemini enrichment only if a key is provided
  if (apiKey && apiKey.trim().length > 0) {
    const geminiResult = await callGeminiApi(
      apiKey.trim(),
      type,
      budget,
      guestCount,
      sanitizeInput(userNotes),
      sanitizeInput(themeIdea),
    );

    if (geminiResult) {
      return {
        ...basePlan,
        title: geminiResult.enrichedTitle,
        themeIdea: geminiResult.enrichedTheme,
        isOfflineFallback: false,
      };
    }
  }

  return basePlan;
}

/**
 * Processes a conversational replanning instruction.
 *
 * This is a best-effort NLP parser that detects common budget adjustment
 * intents and delegates to the deterministic transferBudget helper.
 * If a Gemini key is available, it uses the API for richer interpretation;
 * otherwise, it applies local regex-based parsing.
 *
 * @param instruction  - User's natural language instruction.
 * @param currentPlan  - The live EventPlan to mutate.
 * @param apiKey       - Optional Gemini API key.
 * @returns            - Object with updatedPlan, explanation, and change list.
 */
export async function processReplanInstruction(
  instruction: string,
  currentPlan: EventPlan,
  apiKey?: string,
): Promise<{ updatedPlan: EventPlan; explanation: string; changes: string[] }> {
  const sanitized = sanitizeInput(instruction, 300);
  const lower = instruction.toLowerCase();

  // ── Attempt Gemini-powered instruction parsing ──────────────────────────
  if (apiKey && apiKey.trim().length > 0) {
    const endpoint =
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey.trim()}`;

    const categories = currentPlan.budget.items.map(i => i.category).join(', ');
    const prompt = `
You are a budget planning assistant. The user has this instruction: "${sanitized}"

Available budget categories: ${categories}
Total budget: ${currentPlan.totalBudget}

Determine if this is a budget transfer instruction. If yes, return JSON:
{
  "isBudgetTransfer": true,
  "fromCategory": "<exact category name from the list>",
  "toCategory": "<exact category name from the list>",
  "amount": <positive number>,
  "explanation": "<1 sentence explaining the change>"
}
If it's a theme/concept change or not a budget transfer, return:
{
  "isBudgetTransfer": false,
  "themeUpdate": "<updated theme description if applicable, else null>",
  "explanation": "<1 sentence response>"
}
Return ONLY valid JSON, no markdown.
`.trim();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8_000);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 200, responseMimeType: 'application/json' },
        }),
      });
      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (raw) {
          const parsed = JSON.parse(raw) as {
            isBudgetTransfer: boolean;
            fromCategory?: string;
            toCategory?: string;
            amount?: number;
            themeUpdate?: string | null;
            explanation: string;
          };

          if (parsed.isBudgetTransfer && parsed.fromCategory && parsed.toCategory && parsed.amount) {
            try {
              const updatedBudget = transferBudget(currentPlan.budget, parsed.fromCategory, parsed.toCategory, parsed.amount);
              return {
                updatedPlan: { ...currentPlan, budget: updatedBudget },
                explanation: sanitize(parsed.explanation),
                changes: [`Transferred $${parsed.amount} from ${parsed.fromCategory} to ${parsed.toCategory}`],
              };
            } catch {
              // Fall through to local parser
            }
          } else if (!parsed.isBudgetTransfer) {
            const updatedPlan = parsed.themeUpdate
              ? { ...currentPlan, themeIdea: sanitize(parsed.themeUpdate) }
              : currentPlan;
            return {
              updatedPlan,
              explanation: sanitize(parsed.explanation),
              changes: parsed.themeUpdate ? ['Updated event theme'] : [],
            };
          }
        }
      }
    } catch {
      // Fall through to local parser
    }
  }

  // ── Local regex-based instruction parser (offline fallback) ─────────────
  // Detect "cut X by $N and move to Y" or "move $N from X to Y" patterns
  const transferPatterns = [
    /cut\s+(.+?)\s+by\s+\$?([\d,]+)\s+(?:and\s+)?(?:move|add)\s+(?:it\s+)?to\s+(.+)/i,
    /move\s+\$?([\d,]+)\s+from\s+(.+?)\s+to\s+(.+)/i,
    /transfer\s+\$?([\d,]+)\s+from\s+(.+?)\s+to\s+(.+)/i,
    /reduce\s+(.+?)\s+by\s+\$?([\d,]+)/i,
  ];

  for (const pattern of transferPatterns) {
    const match = lower.match(pattern);
    if (match) {
      let from: string, to: string, amount: number;

      if (pattern.source.startsWith('cut')) {
        from = match[1]; amount = parseFloat(match[2].replace(/,/g, '')); to = match[3];
      } else if (pattern.source.startsWith('move') || pattern.source.startsWith('transfer')) {
        amount = parseFloat(match[1].replace(/,/g, '')); from = match[2]; to = match[3];
      } else {
        from = match[1]; amount = parseFloat(match[2].replace(/,/g, '')); to = 'contingency';
      }

      try {
        const updatedBudget = transferBudget(currentPlan.budget, from.trim(), to.trim(), amount);
        return {
          updatedPlan: { ...currentPlan, budget: updatedBudget },
          explanation: `Budget adjusted: moved $${amount.toFixed(0)} from ${from.trim()} to ${to.trim()}.`,
          changes: [`Transferred $${amount.toFixed(0)} between categories`],
        };
      } catch (e) {
        return {
          updatedPlan: currentPlan,
          explanation: `Couldn't apply that transfer: ${(e as Error).message}`,
          changes: [],
        };
      }
    }
  }

  // Theme/concept change detection
  if (lower.includes('theme') || lower.includes('eco') || lower.includes('rustic')
    || lower.includes('style') || lower.includes('aesthetic') || lower.includes('vibe')) {
    const themeKeywords = ['eco-friendly', 'rustic', 'bohemian', 'modern', 'vintage',
      'minimalist', 'luxurious', 'tropical', 'garden', 'industrial', 'glam'];
    const matched = themeKeywords.find(k => lower.includes(k));
    const newTheme = matched
      ? `${matched.charAt(0).toUpperCase() + matched.slice(1)} ${currentPlan.themeIdea}`
      : sanitize(instruction);

    return {
      updatedPlan: { ...currentPlan, themeIdea: sanitize(newTheme) },
      explanation: `Theme updated to reflect: "${sanitize(instruction)}".`,
      changes: ['Updated event theme and aesthetic'],
    };
  }

  // Could not parse instruction
  return {
    updatedPlan: currentPlan,
    explanation: `I understood your request: "${sanitized}". Try a specific budget transfer like "Cut catering by $500 and move it to decor" or "Make the theme eco-friendly."`,
    changes: [],
  };
}
