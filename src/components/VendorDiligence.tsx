/**
 * VendorDiligence – Vendor due-diligence cards
 * Features: deliverables checklist, red flags, benchmark cost ranges
 */

import React, { useState } from 'react';
import { Shield, CheckCircle, AlertTriangle, DollarSign, ChevronDown } from 'lucide-react';
import type { VendorItem } from '../types/event';

interface VendorDiligenceProps {
  vendors: VendorItem[];
}

export const VendorDiligence: React.FC<VendorDiligenceProps> = ({ vendors }) => {
  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(
    new Set(vendors.length > 0 ? [vendors[0].category] : []),
  );

  const toggleVendor = (category: string) => {
    setExpandedVendors(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  return (
    <section aria-labelledby="vendor-heading" className="panel">
      <header className="panel-header">
        <div className="panel-header-left">
          <Shield size={20} className="panel-icon" aria-hidden="true" />
          <h3 id="vendor-heading" className="panel-title">Vendor Due Diligence</h3>
        </div>
        <span className="panel-badge">{vendors.length} vendors</span>
      </header>

      <p className="vendor-intro">
        Benchmark rates, deliverable checklists, and red flags to protect your event budget.
      </p>

      <ul className="vendor-list" aria-label="Vendor diligence cards">
        {vendors.map((vendor, idx) => {
          const isExpanded = expandedVendors.has(vendor.category);
          const headingId = `vendor-heading-${idx}`;

          return (
            <li key={vendor.category} className="vendor-card">
              {/* Vendor Card Header */}
              <button
                type="button"
                onClick={() => toggleVendor(vendor.category)}
                className="vendor-card-header-btn"
                aria-expanded={isExpanded}
                aria-controls={`vendor-body-${idx}`}
                id={headingId}
              >
                <div className="vendor-card-title-row">
                  <div className="vendor-icon-wrap" aria-hidden="true">
                    <Shield size={16} />
                  </div>
                  <div>
                    <h4 className="vendor-title">{vendor.title}</h4>
                    <p className="vendor-category-tag">{vendor.category}</p>
                  </div>
                </div>
                <div className="vendor-card-right">
                  <div className="vendor-cost-badge" aria-label={`Benchmark cost: ${vendor.benchmarkCostRange}`}>
                    <DollarSign size={12} aria-hidden="true" />
                    <span>{vendor.benchmarkCostRange}</span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`vendor-chevron ${isExpanded ? 'vendor-chevron-open' : ''}`}
                    aria-hidden="true"
                  />
                </div>
              </button>

              {/* Vendor Card Body */}
              {isExpanded && (
                <div
                  id={`vendor-body-${idx}`}
                  className="vendor-card-body"
                  aria-labelledby={headingId}
                >
                  {/* Deliverables */}
                  <div className="vendor-section">
                    <h5 className="vendor-section-title">
                      <CheckCircle size={14} aria-hidden="true" className="vendor-section-icon deliverables-icon" />
                      Contract Deliverables
                    </h5>
                    <ul
                      className="vendor-checklist"
                      aria-label={`Deliverables checklist for ${vendor.title}`}
                    >
                      {vendor.deliverables.map((d, i) => (
                        <li key={i} className="vendor-checklist-item">
                          <CheckCircle
                            size={13}
                            className="check-icon-green"
                            aria-hidden="true"
                          />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Red Flags */}
                  <div className="vendor-section vendor-section-red">
                    <h5 className="vendor-section-title">
                      <AlertTriangle size={14} aria-hidden="true" className="vendor-section-icon red-flags-icon" />
                      Red Flags to Avoid
                    </h5>
                    <ul
                      className="vendor-checklist"
                      aria-label={`Red flags for ${vendor.title}`}
                    >
                      {vendor.redFlagsToAvoid.map((flag, i) => (
                        <li key={i} className="vendor-checklist-item red-flag-item">
                          <AlertTriangle
                            size={13}
                            className="alert-icon-red"
                            aria-hidden="true"
                          />
                          <span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cost Range Callout */}
                  <div
                    className="vendor-cost-callout"
                    aria-label={`Market benchmark range for ${vendor.category}`}
                  >
                    <DollarSign size={14} aria-hidden="true" />
                    <span>
                      <strong>Market benchmark:</strong> {vendor.benchmarkCostRange}
                    </span>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
};
