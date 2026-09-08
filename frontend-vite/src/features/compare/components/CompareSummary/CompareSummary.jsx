import { useMemo, useState } from "react";
import {
  TrendingUp,
  MapPin,
  DollarSign,
  Award,
} from "lucide-react";

import { scoreProperties } from "../../../../utils/compareScoring";
import { formatCurrencyShort } from "../../../../utils/formatters";

import "./CompareSummary.css";


/* ─────────────────────────────
   Helpers
───────────────────────────── */

const isValidNumber = (value) =>
  typeof value === "number" && Number.isFinite(value);


const StatCard = ({ icon: Icon, label, value }) => (
  <div className="cs-stat">
    <span className="cs-stat__icon" aria-hidden="true">
      <Icon size={15} strokeWidth={1.5} />
    </span>

    <div className="cs-stat__body">
      <span className="cs-stat__label">
        {label}
      </span>

      <span className="cs-stat__value">
        {value}
      </span>
    </div>
  </div>
);


/* ─────────────────────────────
   Component
───────────────────────────── */

const CompareSummary = ({ properties = [] }) => {
  const [expanded, setExpanded] = useState(false);

  const comparison = useMemo(() => {
    if (!Array.isArray(properties) || properties.length < 2) {
      return null;
    }

    const prices = properties
      .map((property) => property.price)
      .filter(isValidNumber);

    const cities = [
      ...new Set(
        properties
          .map((property) => property.city)
          .filter(Boolean)
      ),
    ];

    const minPrice =
      prices.length > 0
        ? Math.min(...prices)
        : null;

    const maxPrice =
      prices.length > 0
        ? Math.max(...prices)
        : null;

    const scoredProperties = scoreProperties(properties);

    const bestPick = scoredProperties.reduce(
      (best, property) => {
        if (!best) return property;

        return property.comparisonScore >
          best.comparisonScore
          ? property
          : best;
      },
      null
    );

    return {
      count: properties.length,
      cities,
      minPrice,
      maxPrice,

      priceDifference:
        prices.length >= 2
          ? maxPrice - minPrice
          : null,

      bestPick:
        bestPick?.comparisonScore > 0
          ? bestPick
          : null,
    };
  }, [properties]);


  const title = useMemo(() => {
    if (!comparison) return null;

    if (comparison.count === 2) {
      return `${properties[0]?.title || "Property A"} vs ${
        properties[1]?.title || "Property B"
      }`;
    }

    return `Comparing ${comparison.count} Properties`;
  }, [comparison, properties]);


  if (!comparison) {
    return null;
  }


  const {
    count,
    cities,
    minPrice,
    maxPrice,
    priceDifference,
    bestPick,
  } = comparison;


  return (
    <section
      className="compare-summary"
      aria-labelledby="compare-summary-title"
    >
      {/* Title */}

      <h2
        id="compare-summary-title"
        className="cs-title"
      >
        {title}
      </h2>


      {/* Stats */}

      <div className="cs-stats">
        <StatCard
          icon={TrendingUp}
          label="Properties"
          value={`${count} selected`}
        />

        {cities.length > 0 && (
          <StatCard
            icon={MapPin}
            label="Cities"
            value={cities.join(", ")}
          />
        )}

        {minPrice !== null && (
          <StatCard
            icon={DollarSign}
            label="Price range"
            value={
              minPrice === maxPrice
                ? formatCurrencyShort(minPrice)
                : `${formatCurrencyShort(
                    minPrice
                  )} – ${formatCurrencyShort(maxPrice)}`
            }
          />
        )}

        {priceDifference !== null &&
          priceDifference > 0 && (
            <StatCard
              icon={DollarSign}
              label="Price difference"
              value={formatCurrencyShort(
                priceDifference
              )}
            />
          )}
      </div>


      {/* Description */}

      <div
        id="comparison-description"
        className={`cs-desc ${
          expanded
            ? "cs-desc--expanded"
            : ""
        }`}
      >
        <p>
          {expanded
            ? `This comparison includes ${count} properties${
                cities.length
                  ? ` across ${cities.join(", ")}`
                  : ""
              }. Compare prices, property sizes, amenities, possession status, and approval information to evaluate the available options.`
            : `You're comparing ${count} properties. Review prices, amenities, specifications, and approvals to understand the differences.`}
        </p>
      </div>


      <button
        type="button"
        className="cs-toggle"
        onClick={() =>
          setExpanded((previous) => !previous)
        }
        aria-expanded={expanded}
        aria-controls="comparison-description"
      >
        {expanded
          ? "Show less"
          : "Read more"}
      </button>


      {/* Recommendation */}

      {bestPick && (
        <aside
          className="cs-ai"
          aria-label="Comparison recommendation"
        >
          <div className="cs-ai__header">
            <Award
              size={15}
              strokeWidth={1.5}
              aria-hidden="true"
            />

            <span>
              Comparison recommendation
            </span>
          </div>


          <p className="cs-ai__text">
            Based on the available comparison data,{" "}

            <strong>
              {bestPick.title || "this property"}
            </strong>{" "}

            has the strongest overall balance across
            value, size, amenities, possession, and
            available trust signals.
          </p>


          {bestPick.comparisonReasons?.length > 0 && (
            <ul className="cs-ai__reasons">
              {bestPick.comparisonReasons.map(
                (reason) => (
                  <li key={reason}>
                    {reason}
                  </li>
                )
              )}
            </ul>
          )}
        </aside>
      )}
    </section>
  );
};


export default CompareSummary;