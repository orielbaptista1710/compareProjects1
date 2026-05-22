// CompareSummary.js
import React, { useMemo, useState } from "react";
import { TrendingUp, MapPin, DollarSign, Award } from "lucide-react";
import { scorePropertiesAI } from "../../../utils/compareAI";
import { formatCurrencyShort } from "../../../utils/formatters";
import "./CompareSummary.css";

/* ── helpers ── */
const StatCard = ({ icon: Icon, label, value }) => (
  <div className="cs-stat">
    <span className="cs-stat__icon"><Icon size={15} strokeWidth={1.5} /></span>
    <div className="cs-stat__body">
      <span className="cs-stat__label">{label}</span>
      <span className="cs-stat__value">{value}</span>
    </div>
  </div>
);

/* ── component ── */
const CompareSummary = ({ properties = [] }) => {
  const [expanded, setExpanded] = useState(false);

  const summary = useMemo(() => {
    const prices = properties.map((p) => p.price).filter(Number);
    const cities = [...new Set(properties.map((p) => p.city).filter(Boolean))];

    return {
      count:    properties.length,
      cities,
      minPrice: prices.length ? Math.min(...prices) : null,
      maxPrice: prices.length ? Math.max(...prices) : null,
      priceDiff:
        prices.length >= 2
          ? Math.max(...prices) - Math.min(...prices)
          : null,
    };
  }, [properties]);

  const bestPick = useMemo(() => {
    const scored = scorePropertiesAI(properties);
    if (!scored.length) return null;
    const [top] = [...scored].sort((a, b) => b.aiScore - a.aiScore);
    return top?.aiScore > 0 ? top : null;
  }, [properties]);

  const title = useMemo(() => {
    if (properties.length === 0) return null;
    if (properties.length === 2)
      return `${properties[0]?.title || "Property A"} vs ${properties[1]?.title || "Property B"}`;
    return `Comparing ${summary.count} Properties`;
  }, [properties, summary.count]);

  if (properties.length < 2) return null;

  return (
    <section className="compare-summary" aria-live="polite">
      {/* Title */}
      <h2 className="cs-title">{title}</h2>

      {/* Stat strip */}
      <div className="cs-stats">
        <StatCard
          icon={TrendingUp}
          label="Properties"
          value={`${summary.count} selected`}
        />
        {summary.cities.length > 0 && (
          <StatCard
            icon={MapPin}
            label="Cities"
            value={summary.cities.join(", ")}
          />
        )}
        {summary.minPrice && (
          <StatCard
            icon={DollarSign}
            label="Price range"
            value={
              summary.minPrice === summary.maxPrice
                ? formatCurrencyShort(summary.minPrice)
                : `${formatCurrencyShort(summary.minPrice)} – ${formatCurrencyShort(summary.maxPrice)}`
            }
          />
        )}
        {summary.priceDiff != null && summary.priceDiff > 0 && (
          <StatCard
            icon={DollarSign}
            label="Price gap"
            value={formatCurrencyShort(summary.priceDiff)}
          />
        )}
      </div>

      {/* Expandable description */}
      <div className={`cs-desc ${expanded ? "cs-desc--expanded" : ""}`}>
        <p>
          {expanded
            ? `This comparison includes ${summary.count} properties${
                summary.cities.length
                  ? ` across ${summary.cities.join(", ")}`
                  : ""
              }. Review prices, sizes, amenities, and approval statuses below to make an informed decision.`
            : `You're comparing ${summary.count} properties. Review prices, amenities, specifications, and approvals below.`}
        </p>
      </div>

      <button
        type="button"
        className="cs-toggle"
        onClick={() => setExpanded((p) => !p)}
        aria-expanded={expanded}
      >
        {expanded ? "Show less" : "Read more"}
      </button>

      {/* AI recommendation */}
      {bestPick && (
        <aside className="cs-ai" role="note">
          <div className="cs-ai__header">
            <Award size={15} strokeWidth={1.5} />
            <span>AI Recommendation</span>
          </div>
          <p className="cs-ai__text">
            Based on value, size, amenities, readiness, and trust signals,{" "}
            <strong>{bestPick.title || "this property"}</strong> emerges as the
            strongest overall option.
          </p>
          {bestPick.aiReasons?.length > 0 && (
            <ul className="cs-ai__reasons">
              {bestPick.aiReasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          )}
        </aside>
      )}
    </section>
  );
};

export default CompareSummary;