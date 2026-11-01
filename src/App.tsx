/**
 * EventGenie AI – Root Application
 * Hack2Skill PromptWars Challenge 5 – Celebration & Event Planner
 *
 * State management, routing between configurator and plan views,
 * keyboard navigation, and semantic HTML5 structure.
 */

import React, { useState, useCallback } from 'react';
import { Sparkles, GitBranch, ExternalLink, ArrowLeft } from 'lucide-react';
import { EventConfigurator } from './components/EventConfigurator';
const BudgetBreakdown = React.lazy(() => import('./components/BudgetBreakdown').then(m => ({ default: m.BudgetBreakdown })));
const TimelineChecklist = React.lazy(() => import('./components/TimelineChecklist').then(m => ({ default: m.TimelineChecklist })));
const VendorDiligence = React.lazy(() => import('./components/VendorDiligence').then(m => ({ default: m.VendorDiligence })));
const ConversationalReplanner = React.lazy(() => import('./components/ConversationalReplanner').then(m => ({ default: m.ConversationalReplanner })));
import { generateCustomEventPlan } from './services/geminiService';
import type { EventFormValues, EventPlan } from './types/event';

type Tab = 'budget' | 'timeline' | 'vendors' | 'assistant';

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'budget', label: 'Budget', emoji: '💰' },
  { id: 'timeline', label: 'Timeline', emoji: '📅' },
  { id: 'vendors', label: 'Vendors', emoji: '🤝' },
  { id: 'assistant', label: 'AI Assistant', emoji: '🧞' },
];

const App: React.FC = () => {
  const [plan, setPlan] = useState<EventPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('budget');
  const [apiKey, setApiKey] = useState<string>('');

  const handleGenerate = useCallback(async (values: EventFormValues) => {
    setIsLoading(true);
    setError(null);

    // Store API key in session-scope state only (never in localStorage)
    setApiKey(values.geminiApiKey);

    try {
      const generatedPlan = await generateCustomEventPlan(
        values.eventType,
        parseFloat(values.totalBudget),
        parseInt(values.guestCount, 10),
        values.themeIdea,
        values.userNotes,
        values.geminiApiKey || undefined,
        values.currency,
      );
      setPlan(generatedPlan);
      setActiveTab('budget');
      // Scroll to plan after generation
      setTimeout(() => {
        document.getElementById('event-plan-output')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred. Please check your inputs and try again.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTaskToggle = useCallback((taskId: string) => {
    setPlan(prev =>
      prev
        ? {
            ...prev,
            timeline: prev.timeline.map(task =>
              task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task,
            ),
          }
        : prev,
    );
  }, []);

  const handlePlanUpdate = useCallback((updatedPlan: EventPlan) => {
    setPlan(updatedPlan);
  }, []);

  const handleReset = () => {
    setPlan(null);
    setError(null);
    setApiKey('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-wrapper">
      {/* Skip Navigation for Accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Site Header */}
      <header className="site-header" role="banner">
        <div className="header-inner">
          <div className="brand">
            <div className="brand-icon" aria-hidden="true">
              <Sparkles size={22} />
            </div>
            <div>
              <span className="brand-name">EventGenie AI</span>
              <span className="brand-tagline">Hack2Skill · PromptWars Challenge 5</span>
            </div>
          </div>
          <nav aria-label="External links">
            <a
              href="https://hack2skill.com"
              target="_blank"
              rel="noopener noreferrer"
              className="header-link"
              aria-label="Hack2Skill website (opens in new tab)"
            >
              <ExternalLink size={14} aria-hidden="true" />
              Hack2Skill
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="header-link"
              aria-label="GitHub repository (opens in new tab)"
            >
              <GitBranch size={14} aria-hidden="true" />
              GitHub
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="main-content">
        {/* Hero */}
        {!plan && (
          <section className="hero" aria-labelledby="hero-heading">
            <div className="hero-badge" aria-label="Hackathon challenge badge">
              <Sparkles size={14} aria-hidden="true" />
              Hack2Skill PromptWars · Challenge 5
            </div>
            <h1 id="hero-heading" className="hero-title">
              Plan Any Event with
              <span className="hero-gradient"> AI Precision</span>
            </h1>
            <p className="hero-subtitle">
              From grand weddings to college hackathons — get a complete budget plan,
              dynamic timeline, vendor diligence pack, and an AI assistant that adjusts
              your plan in real time. Works fully offline.
            </p>
            <div className="hero-features" role="list" aria-label="Key features">
              {[
                { icon: '💰', text: 'Zero-drift budget math' },
                { icon: '📅', text: 'Dynamic timeline' },
                { icon: '🤝', text: 'Vendor diligence' },
                { icon: '🧞', text: 'AI replanning' },
                { icon: '🔒', text: 'Works offline' },
              ].map(f => (
                <div key={f.text} className="hero-feature" role="listitem">
                  <span aria-hidden="true">{f.icon}</span>
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Error Banner */}
        {error && (
          <div
            className="error-banner"
            role="alert"
            aria-live="assertive"
            aria-label={`Error: ${error}`}
          >
            <strong>Error:</strong> {error}
            <button
              type="button"
              onClick={() => setError(null)}
              className="error-dismiss"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        <div className="content-layout">
          {/* Configurator — always visible */}
          <aside className={`configurator-column ${plan ? 'configurator-compact' : ''}`}>
            {plan && (
              <button
                type="button"
                onClick={handleReset}
                className="back-btn"
                aria-label="Start over with a new event"
              >
                <ArrowLeft size={16} aria-hidden="true" />
                New Event
              </button>
            )}
            <EventConfigurator onGenerate={handleGenerate} isLoading={isLoading} />
          </aside>

          {/* Plan Output */}
          {plan && (
            <section
              id="event-plan-output"
              className="plan-column"
              aria-labelledby="plan-heading"
            >
              {/* Plan Header */}
              <div className="plan-header-card">
                <div className="plan-header-text">
                  <h2 id="plan-heading" className="plan-event-title">{plan.title}</h2>
                  <p className="plan-meta">
                    <span>{plan.type.charAt(0).toUpperCase() + plan.type.slice(1)}</span>
                    <span className="meta-dot" aria-hidden="true">·</span>
                    <span>{plan.guestCount.toLocaleString()} guests</span>
                    <span className="meta-dot" aria-hidden="true">·</span>
                    <span>{plan.budget.currency}</span>
                    {plan.isOfflineFallback && (
                      <>
                        <span className="meta-dot" aria-hidden="true">·</span>
                        <span className="offline-indicator" aria-label="Generated using offline engine">
                          ⚡ Offline Engine
                        </span>
                      </>
                    )}
                  </p>
                  {plan.themeIdea && (
                    <p className="plan-theme">
                      <span aria-hidden="true">🎨</span> {plan.themeIdea}
                    </p>
                  )}
                </div>
                <div className="plan-generated-at">
                  <time dateTime={plan.generatedAt}>
                    Generated {new Date(plan.generatedAt).toLocaleTimeString()}
                  </time>
                </div>
              </div>

              {/* Tab Navigation */}
              <nav
                aria-label="Plan sections"
                className="tab-nav"
              >
                <div role="tablist" aria-label="Event plan sections" className="tab-list">
                  {TABS.map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      id={`tab-${tab.id}`}
                      aria-selected={activeTab === tab.id}
                      aria-controls={`tabpanel-${tab.id}`}
                      onClick={() => setActiveTab(tab.id)}
                      className={`tab-btn ${activeTab === tab.id ? 'tab-active' : ''}`}
                    >
                      <span aria-hidden="true">{tab.emoji}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </nav>

              {/* Tab Panels */}
              <React.Suspense fallback={<div className="py-12 text-center text-slate-400 text-sm animate-pulse">Loading workspace module...</div>}>
              <div
                id={`tabpanel-budget`}
                role="tabpanel"
                aria-labelledby="tab-budget"
                hidden={activeTab !== 'budget'}
                tabIndex={0}
              >
                {activeTab === 'budget' && <BudgetBreakdown budget={plan.budget} />}
              </div>

              <div
                id="tabpanel-timeline"
                role="tabpanel"
                aria-labelledby="tab-timeline"
                hidden={activeTab !== 'timeline'}
                tabIndex={0}
              >
                {activeTab === 'timeline' && (
                  <TimelineChecklist tasks={plan.timeline} onTaskToggle={handleTaskToggle} />
                )}
              </div>

              <div
                id="tabpanel-vendors"
                role="tabpanel"
                aria-labelledby="tab-vendors"
                hidden={activeTab !== 'vendors'}
                tabIndex={0}
              >
                {activeTab === 'vendors' && <VendorDiligence vendors={plan.vendors} />}
              </div>

              <div
                id="tabpanel-assistant"
                role="tabpanel"
                aria-labelledby="tab-assistant"
                hidden={activeTab !== 'assistant'}
                tabIndex={0}
              >
                {activeTab === 'assistant' && (
                  <ConversationalReplanner
                    plan={plan}
                    apiKey={apiKey || undefined}
                    onPlanUpdate={handlePlanUpdate}
                  />
                )}
              </div>
              </React.Suspense>
            </section>
          )}
        </div>
      </main>

      {/* Site Footer */}
      <footer className="site-footer" role="contentinfo">
        <p>
          EventGenie AI · Built for{' '}
          <a
            href="https://hack2skill.com"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            Hack2Skill PromptWars Challenge 5
          </a>{' '}
          · Deterministic Math Engine + Gemini AI Hybrid ·{' '}
          <span aria-label="No API key required">Works 100% offline</span>
        </p>
      </footer>
    </div>
  );
};

export default App;
