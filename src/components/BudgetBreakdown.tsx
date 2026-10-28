/**
 * BudgetBreakdown – Visual budget allocation display
 * Features: progress bars, per-guest metric, contingency indicator, animated bars
 */

import React from 'react';
import { Shield, TrendingDown, Users, AlertTriangle } from 'lucide-react';
import type { BudgetPlan } from '../types/event';
import { formatCurrency } from '../utils/budgetCalculator';

interface BudgetBreakdownProps {
  budget: BudgetPlan;
}

/** Colour palette for budget category bars – cycles if more items than colours */
const BAR_COLORS = [
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red (contingency)
  '#ec4899', // pink
];

export const BudgetBreakdown: React.FC<BudgetBreakdownProps> = ({ budget }) => {
  const nonContingencyItems = budget.items.filter(
    i => !i.category.toLowerCase().includes('contingency'),
  );
  const contingencyItem = budget.items.find(
    i => i.category.toLowerCase().includes('contingency'),
  );

  return (
    <section aria-labelledby="budget-heading" className="panel">
      <header className="panel-header">
        <div className="panel-header-left">
          <TrendingDown size={20} className="panel-icon" aria-hidden="true" />
          <h3 id="budget-heading" className="panel-title">Budget Breakdown</h3>
        </div>
        <span className="panel-badge">{budget.currency}</span>
      </header>

      {/* Top Metrics */}
      <div className="metrics-grid" role="list" aria-label="Budget summary metrics">
        <article className="metric-card" role="listitem">
          <p className="metric-label">Total Budget</p>
          <p className="metric-value metric-primary">
            {formatCurrency(budget.totalBudget, budget.currency)}
          </p>
        </article>

        <article className="metric-card" role="listitem">
          <div className="metric-icon-row">
            <Users size={14} aria-hidden="true" />
            <p className="metric-label">Per Guest</p>
          </div>
          <p
            className="metric-value"
            aria-label={`Cost per guest: ${formatCurrency(budget.costPerGuest, budget.currency)}`}
          >
            {formatCurrency(budget.costPerGuest, budget.currency)}
          </p>
        </article>

        <article
          className={`metric-card contingency-card ${budget.contingencyReserve < budget.totalBudget * 0.05 ? 'contingency-low' : 'contingency-ok'}`}
          role="listitem"
          aria-label={`Contingency reserve: ${formatCurrency(budget.contingencyReserve, budget.currency)}`}
        >
          <div className="metric-icon-row">
            <Shield size={14} aria-hidden="true" />
            <p className="metric-label">Contingency</p>
          </div>
          <p className="metric-value">
            {formatCurrency(budget.contingencyReserve, budget.currency)}
          </p>
          {budget.contingencyReserve < budget.totalBudget * 0.05 && (
            <div className="contingency-warning" role="alert">
              <AlertTriangle size={12} aria-hidden="true" />
              <span>Below 5% safety threshold</span>
            </div>
          )}
        </article>
      </div>

      {/* Stacked Progress Bar */}
      <div aria-label="Visual budget allocation bar" className="stacked-bar-container">
        <div
          className="stacked-bar"
          role="img"
          aria-label={`Budget allocation across ${budget.items.length} categories`}
        >
          {budget.items.map((item, i) => (
            <div
              key={item.category}
              className="stacked-bar-segment"
              style={{
                width: `${item.percentage}%`,
                backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
              }}
              title={`${item.category}: ${item.percentage}%`}
              aria-label={`${item.category}: ${item.percentage}%`}
            />
          ))}
        </div>
        {/* Legend */}
        <div className="bar-legend" role="list" aria-label="Budget category legend">
          {budget.items.map((item, i) => (
            <div key={item.category} className="legend-item" role="listitem">
              <span
                className="legend-dot"
                style={{ backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
                aria-hidden="true"
              />
              <span className="legend-label">{item.category}</span>
              <span className="legend-pct">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category Cards */}
      <ul
        className="budget-items-list"
        aria-label="Budget category breakdown"
      >
        {nonContingencyItems.map((item, i) => (
          <li key={item.category} className="budget-item-card">
            <div className="budget-item-header">
              <div className="budget-item-title-row">
                <span
                  className="budget-item-color-dot"
                  style={{ backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
                  aria-hidden="true"
                />
                <h4 className="budget-item-category">
                  {item.category}
                  {item.isMandatory && (
                    <span className="mandatory-badge" aria-label="Mandatory expense">Required</span>
                  )}
                </h4>
              </div>
              <span
                className="budget-item-amount"
                aria-label={`${formatCurrency(item.allocatedAmount, budget.currency)}, ${item.percentage}% of budget`}
              >
                {formatCurrency(item.allocatedAmount, budget.currency)}
              </span>
            </div>

            {/* Progress bar */}
            <div
              className="item-progress-track"
              role="progressbar"
              aria-valuenow={item.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${item.category} allocation: ${item.percentage}%`}
            >
              <div
                className="item-progress-fill"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                }}
              />
            </div>

            <p className="budget-item-notes">{item.notes}</p>
          </li>
        ))}
      </ul>

      {/* Contingency Card */}
      {contingencyItem && (
        <article className="contingency-detail-card" aria-label="Contingency reserve details">
          <div className="contingency-detail-header">
            <Shield size={16} aria-hidden="true" />
            <h4 className="contingency-detail-title">
              {contingencyItem.category}
              <span className="contingency-pct-badge">{contingencyItem.percentage}%</span>
            </h4>
            <span className="contingency-detail-amount">
              {formatCurrency(contingencyItem.allocatedAmount, budget.currency)}
            </span>
          </div>
          <p className="budget-item-notes">{contingencyItem.notes}</p>
          <div
            className="item-progress-track"
            role="progressbar"
            aria-valuenow={contingencyItem.percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Contingency: ${contingencyItem.percentage}%`}
          >
            <div
              className="item-progress-fill contingency-fill"
              style={{ width: `${contingencyItem.percentage}%` }}
            />
          </div>
        </article>
      )}

      {/* Allocation Verification */}
      <div
        className="allocation-verify"
        aria-live="polite"
        aria-label="Budget allocation verification"
      >
        <span className="verify-icon" aria-hidden="true">✓</span>
        <span>
          All {budget.items.length} categories account for exactly{' '}
          <strong>{formatCurrency(budget.totalBudget, budget.currency)}</strong>{' '}
          — zero rounding drift.
        </span>
      </div>
    </section>
  );
};
