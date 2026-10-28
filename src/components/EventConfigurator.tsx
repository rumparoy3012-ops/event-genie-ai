/**
 * EventConfigurator – Event setup form with 1-click presets
 * Accessibility: aria-labels, aria-describedby, aria-invalid, keyboard nav
 */

import React, { useState } from 'react';
import { Calendar, Users, DollarSign, Sparkles, ChevronRight, Zap } from 'lucide-react';
import type { EventFormValues, EventPreset, EventType } from '../types/event';

interface EventConfiguratorProps {
  onGenerate: (values: EventFormValues) => void;
  isLoading: boolean;
}

const PRESETS: EventPreset[] = [
  {
    label: 'Grand Wedding',
    icon: '💍',
    values: {
      eventType: 'wedding',
      title: 'Grand Wedding Celebration',
      guestCount: '200',
      totalBudget: '50000',
      themeIdea: 'Elegant & Timeless – ivory florals, candlelit chandeliers, and a live string quartet',
      currency: 'USD',
    },
  },
  {
    label: '30th Milestone Birthday',
    icon: '🎂',
    values: {
      eventType: 'birthday',
      title: '30th Milestone Birthday Bash',
      guestCount: '75',
      totalBudget: '12000',
      themeIdea: 'Gatsby Glam – black & gold Art Deco theme with a jazz trio and champagne tower',
      currency: 'USD',
    },
  },
  {
    label: 'Inter-College Tech Fest',
    icon: '🚀',
    values: {
      eventType: 'community',
      title: 'Inter-College Hackathon & Tech Fest',
      guestCount: '300',
      totalBudget: '25000',
      themeIdea: 'Future Tech – neon cyberpunk aesthetic with live coding demos and sponsor tech showcases',
      currency: 'USD',
    },
  },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD'];

interface ValidationErrors {
  title?: string;
  guestCount?: string;
  totalBudget?: string;
}

function validate(values: EventFormValues): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!values.title.trim()) errors.title = 'Event title is required.';
  if (values.title.length > 100) errors.title = 'Title must be 100 characters or fewer.';

  const guests = parseInt(values.guestCount, 10);
  if (!values.guestCount || isNaN(guests) || guests <= 0) {
    errors.guestCount = 'Guest count must be a positive whole number.';
  }
  if (guests > 100_000) errors.guestCount = 'Guest count seems unrealistically high (max 100,000).';

  const budget = parseFloat(values.totalBudget);
  if (!values.totalBudget || isNaN(budget) || budget <= 0) {
    errors.totalBudget = 'Budget must be a positive number.';
  }
  if (budget > 100_000_000) errors.totalBudget = 'Budget exceeds maximum allowed value.';

  return errors;
}

export const EventConfigurator: React.FC<EventConfiguratorProps> = ({ onGenerate, isLoading }) => {
  const [values, setValues] = useState<EventFormValues>({
    eventType: 'wedding',
    title: '',
    guestCount: '',
    totalBudget: '',
    themeIdea: '',
    userNotes: '',
    currency: 'USD',
    geminiApiKey: '',
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [showApiKey, setShowApiKey] = useState(false);

  const applyPreset = (preset: EventPreset) => {
    setValues(prev => ({ ...prev, ...preset.values }));
    setErrors({});
    setTouched(new Set());
  };

  const handleChange = (field: keyof EventFormValues, value: string) => {
    setValues(prev => ({ ...prev, [field]: value }));
    if (touched.has(field)) {
      const newErrors = validate({ ...values, [field]: value });
      setErrors(newErrors);
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => new Set(prev).add(field));
    setErrors(validate(values));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched = new Set(['title', 'guestCount', 'totalBudget']);
    setTouched(allTouched);
    const validationErrors = validate(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      onGenerate(values);
    }
  };

  const eventTypes: { value: EventType; label: string; emoji: string }[] = [
    { value: 'wedding', label: 'Wedding', emoji: '💍' },
    { value: 'birthday', label: 'Birthday', emoji: '🎂' },
    { value: 'community', label: 'Community / Hackathon', emoji: '🚀' },
  ];

  return (
    <section
      aria-labelledby="configurator-heading"
      className="configurator-section"
    >
      <div className="configurator-inner">
        {/* Header */}
        <header className="configurator-header">
          <div className="header-icon-wrap" aria-hidden="true">
            <Sparkles size={28} />
          </div>
          <div>
            <h2 id="configurator-heading" className="configurator-title">
              Plan Your Event
            </h2>
            <p className="configurator-subtitle">
              Choose a preset or fill in your details — we'll build a full plan instantly.
            </p>
          </div>
        </header>

        {/* 1-Click Presets */}
        <div
          role="group"
          aria-label="Quick-start event presets"
          className="presets-group"
        >
          <p className="presets-label">Quick-start presets</p>
          <div className="presets-grid">
            {PRESETS.map(preset => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset)}
                className="preset-btn"
                aria-label={`Apply ${preset.label} preset`}
              >
                <span className="preset-icon" aria-hidden="true">{preset.icon}</span>
                <span className="preset-label-text">{preset.label}</span>
                <ChevronRight size={14} className="preset-chevron" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate aria-label="Event configuration form">
          {/* Event Type */}
          <fieldset className="form-fieldset">
            <legend className="form-legend">Event Type</legend>
            <div className="event-type-grid" role="radiogroup" aria-label="Select event type">
              {eventTypes.map(et => (
                <label
                  key={et.value}
                  className={`event-type-option ${values.eventType === et.value ? 'selected' : ''}`}
                  htmlFor={`event-type-${et.value}`}
                >
                  <input
                    type="radio"
                    id={`event-type-${et.value}`}
                    name="eventType"
                    value={et.value}
                    checked={values.eventType === et.value}
                    onChange={() => handleChange('eventType', et.value)}
                    className="sr-only"
                    aria-describedby={`event-type-desc-${et.value}`}
                  />
                  <span className="event-type-emoji" aria-hidden="true">{et.emoji}</span>
                  <span id={`event-type-desc-${et.value}`}>{et.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Event Title */}
          <div className="form-group">
            <label htmlFor="event-title" className="form-label">
              Event Title <span aria-hidden="true" className="required-star">*</span>
            </label>
            <input
              id="event-title"
              type="text"
              value={values.title}
              onChange={e => handleChange('title', e.target.value)}
              onBlur={() => handleBlur('title')}
              placeholder="e.g. Priya & Arjun's Wedding"
              maxLength={100}
              className={`form-input ${errors.title && touched.has('title') ? 'input-error' : ''}`}
              aria-required="true"
              aria-invalid={!!(errors.title && touched.has('title'))}
              aria-describedby={errors.title && touched.has('title') ? 'title-error' : 'title-hint'}
            />
            {errors.title && touched.has('title') ? (
              <span id="title-error" role="alert" className="field-error">{errors.title}</span>
            ) : (
              <span id="title-hint" className="field-hint">A descriptive name for your event</span>
            )}
          </div>

          {/* Guest Count + Currency */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="guest-count" className="form-label">
                <Users size={14} aria-hidden="true" />
                Guest Count <span aria-hidden="true" className="required-star">*</span>
              </label>
              <input
                id="guest-count"
                type="number"
                min="1"
                max="100000"
                step="1"
                value={values.guestCount}
                onChange={e => handleChange('guestCount', e.target.value)}
                onBlur={() => handleBlur('guestCount')}
                placeholder="e.g. 150"
                className={`form-input ${errors.guestCount && touched.has('guestCount') ? 'input-error' : ''}`}
                aria-required="true"
                aria-invalid={!!(errors.guestCount && touched.has('guestCount'))}
                aria-describedby={errors.guestCount && touched.has('guestCount') ? 'guests-error' : 'guests-hint'}
              />
              {errors.guestCount && touched.has('guestCount') ? (
                <span id="guests-error" role="alert" className="field-error">{errors.guestCount}</span>
              ) : (
                <span id="guests-hint" className="field-hint">Expected attendees</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="currency" className="form-label">Currency</label>
              <select
                id="currency"
                value={values.currency}
                onChange={e => handleChange('currency', e.target.value)}
                className="form-input form-select"
                aria-describedby="currency-hint"
              >
                {CURRENCIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <span id="currency-hint" className="field-hint">Budget currency</span>
            </div>
          </div>

          {/* Total Budget */}
          <div className="form-group">
            <label htmlFor="total-budget" className="form-label">
              <DollarSign size={14} aria-hidden="true" />
              Total Budget <span aria-hidden="true" className="required-star">*</span>
            </label>
            <input
              id="total-budget"
              type="number"
              min="1"
              max="100000000"
              step="0.01"
              value={values.totalBudget}
              onChange={e => handleChange('totalBudget', e.target.value)}
              onBlur={() => handleBlur('totalBudget')}
              placeholder="e.g. 25000"
              className={`form-input ${errors.totalBudget && touched.has('totalBudget') ? 'input-error' : ''}`}
              aria-required="true"
              aria-invalid={!!(errors.totalBudget && touched.has('totalBudget'))}
              aria-describedby={errors.totalBudget && touched.has('totalBudget') ? 'budget-error' : 'budget-hint'}
            />
            {errors.totalBudget && touched.has('totalBudget') ? (
              <span id="budget-error" role="alert" className="field-error">{errors.totalBudget}</span>
            ) : (
              <span id="budget-hint" className="field-hint">Total available planning budget</span>
            )}
          </div>

          {/* Theme Idea */}
          <div className="form-group">
            <label htmlFor="theme-idea" className="form-label">
              <Calendar size={14} aria-hidden="true" />
              Theme Idea
            </label>
            <input
              id="theme-idea"
              type="text"
              value={values.themeIdea}
              onChange={e => handleChange('themeIdea', e.target.value)}
              placeholder="e.g. Rustic garden party with fairy lights"
              maxLength={200}
              className="form-input"
              aria-describedby="theme-hint"
            />
            <span id="theme-hint" className="field-hint">Optional – used by Gemini AI for enriched suggestions</span>
          </div>

          {/* User Notes */}
          <div className="form-group">
            <label htmlFor="user-notes" className="form-label">Planner Notes</label>
            <textarea
              id="user-notes"
              value={values.userNotes}
              onChange={e => handleChange('userNotes', e.target.value)}
              placeholder="e.g. We want a beach ceremony, gluten-free menu, and a live band instead of DJ"
              maxLength={500}
              rows={3}
              className="form-input form-textarea"
              aria-describedby="notes-hint"
            />
            <span id="notes-hint" className="field-hint">
              Additional preferences (max 500 chars). Processed by AI when key is provided.
            </span>
          </div>

          {/* Gemini API Key */}
          <div className="form-group api-key-group">
            <label htmlFor="gemini-api-key" className="form-label">
              <Zap size={14} aria-hidden="true" />
              Gemini API Key
              <span className="optional-badge">Optional</span>
            </label>
            <div className="api-key-input-wrap">
              <input
                id="gemini-api-key"
                type={showApiKey ? 'text' : 'password'}
                value={values.geminiApiKey}
                onChange={e => handleChange('geminiApiKey', e.target.value)}
                placeholder="AIza..."
                className="form-input"
                autoComplete="off"
                spellCheck={false}
                aria-describedby="apikey-hint"
              />
              <button
                type="button"
                className="api-key-toggle"
                onClick={() => setShowApiKey(prev => !prev)}
                aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
              >
                {showApiKey ? '🙈' : '👁️'}
              </button>
            </div>
            <span id="apikey-hint" className="field-hint">
              Stored only in session memory. Leave blank to use the offline fallback engine.
            </span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="generate-btn"
            aria-busy={isLoading}
            aria-label={isLoading ? 'Generating your event plan, please wait' : 'Generate event plan'}
          >
            {isLoading ? (
              <>
                <span className="btn-spinner" aria-hidden="true" />
                Generating Plan…
              </>
            ) : (
              <>
                <Sparkles size={18} aria-hidden="true" />
                Generate My Event Plan
              </>
            )}
          </button>
        </form>
      </div>
    </section>
  );
};
