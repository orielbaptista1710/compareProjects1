import React, { useMemo, useState } from "react";
import { scorePropertiesAI } from "../../../utils/compareAI";
import { formatCurrencyShort } from "../../../utils/formatters";
import "./CompareSummary.css";


const CompareSummary = ({ properties = [] }) => {
  const [expanded, setExpanded] = useState(false);

  const summaryData = useMemo(() => {
    const prices = properties.map(p => p.price).filter(Number);

    return {
      count: properties.length,
      cities: [...new Set(properties.map(p => p.city).filter(Boolean))],
      minPrice: prices.length ? Math.min(...prices) : null,
      maxPrice: prices.length ? Math.max(...prices) : null,
    };
  }, [properties]);

  const aiRecommendation = useMemo(() => {
    const scored = scorePropertiesAI(properties);
    if (!scored.length) return null;

    const sorted = [...scored].sort((a, b) => b.aiScore - a.aiScore);
    return sorted[0]?.aiScore > 0
      ? { best: sorted[0] }
      : null;
  }, [properties]);

  if (properties.length < 2) return null;

  const title =
    properties.length === 2
      ? `${properties[0]?.title || "Property 1"} vs ${properties[1]?.title || "Property 2"}`
      : `Comparing ${summaryData.count} Properties`;

  return (
    <section className="compare-summary" aria-live="polite">
      <h2 className="summary-title">{title}</h2>

      <p className="summary-text">
        {expanded ? (
          <>
            This comparison includes {summaryData.count} properties
            {summaryData.cities.length
              ? ` across ${summaryData.cities.join(", ")}`
              : ""}.
            {summaryData.minPrice && summaryData.maxPrice && (
              <>
                {" "}Prices range from{" "}
                <strong>{formatCurrencyShort(summaryData.minPrice)}</strong> to{" "}
                <strong>{formatCurrencyShort(summaryData.maxPrice)}</strong>.
              </>
            )}
          </>
        ) : (
          `You’re comparing ${summaryData.count} properties. Review prices, amenities, specifications, and approvals below.`
        )}
      </p>

      <button
        type="button"
        className="summary-readmore"
        onClick={() => setExpanded(p => !p)}
        aria-expanded={expanded}
      >
        {expanded ? "Show Less" : "Read More"}
      </button>

      {aiRecommendation && (
        <aside className="ai-recommendation" role="note">
          <h3>🤖 Which one should you choose?</h3>

          <p>
            Based on value, size, amenities, readiness, and trust signals,{" "}
            <strong>{aiRecommendation.best.title || "this property"}</strong>{" "}
            emerges as the strongest overall option.
          </p>

          {aiRecommendation.best.aiReasons?.length > 0 && (
            <ul>
              {aiRecommendation.best.aiReasons.map((reason, i) => (
                <li key={i}>✅ {reason}</li>
              ))}
            </ul>
          )}
        </aside>
      )}
    </section>
  );
};

export default CompareSummary;
