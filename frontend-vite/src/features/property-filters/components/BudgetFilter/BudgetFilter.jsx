// frontend-vite/src/pages/Properties/PropertiesPageComponets/BudgetFilter/BudgetFilter.jsx
import React from "react";
// Shared ₹ formatter (also used by filters.schema.js for the Budget chip text) — using it
// here too instead of a local formatPrice avoids duplicate lakh/crore logic and the
// react-refresh lint error that came from exporting a non-component helper from this file.
import { formatCurrencyShort } from "../../../../utils/formatters";
import "./BudgetFilter.css";

/**
 * Price ladder in ₹ (shared by both the dropdowns and the slider).
 * index 0        -> no minimum ("Min")
 * last index     -> no maximum ("Max")
 * 5L steps up to 95L, then 25L steps up to 5Cr.
 */
const STEPS = (() => {
  const out = [0];
  for (let v = 500000; v < 10000000; v += 500000) out.push(v);
  for (let v = 10000000; v <= 50000000; v += 2500000) out.push(v);
  out.push(Infinity);
  return out;
})();

const LAST = STEPS.length - 1;

const labelFor = (i) =>
  i === 0 ? "Min" : i === LAST ? "Max" : formatCurrencyShort(STEPS[i]);

// price -> ladder index (falls back when the value isn't on the ladder)
const indexOf = (price, fallback) => {
  if (price == null) return fallback;
  const i = STEPS.indexOf(price);
  return i === -1 ? fallback : i;
};

const BudgetFilter = ({ value, onChange, onDone }) => {
  const minIdx = indexOf(value?.min, 0);
  const maxIdx = indexOf(value?.max, LAST);

  // Emit null when nothing is constrained, so the parent can treat it as "no filter"
  const emit = (lo, hi) => {
    const min = lo === 0 ? null : STEPS[lo];
    const max = hi === LAST ? null : STEPS[hi];
    onChange(min == null && max == null ? null : { min, max });
  };

  const setMin = (i) => emit(Math.min(i, maxIdx), maxIdx);
  const setMax = (i) => emit(minIdx, Math.max(i, minIdx));

  const pct = (i) => (i / LAST) * 100;

  return (
    <div className="budget-filter">
      {/* Dropdowns */}
      <div className="bf-selects">
        <select
          className="bf-select"
          value={minIdx}
          onChange={(e) => setMin(Number(e.target.value))}
          aria-label="Minimum budget"
        >
          {STEPS.slice(0, LAST).map((_, i) => (
            <option key={i} value={i}>
              {labelFor(i)}
            </option>
          ))}
        </select>

        <span className="bf-to">to</span>

        <select
          className="bf-select"
          value={maxIdx}
          onChange={(e) => setMax(Number(e.target.value))}
          aria-label="Maximum budget"
        >
          {STEPS.map((_, i) =>
            i === 0 ? null : (
              <option key={i} value={i}>
                {labelFor(i)}
              </option>
            )
          )}
        </select>
      </div>

      {/* Dual slider — two native ranges stacked on one track */}
      <div className="bf-slider">
        <div className="bf-track" />
        <div
          className="bf-track-fill"
          style={{ left: `${pct(minIdx)}%`, right: `${100 - pct(maxIdx)}%` }}
        />
        <input
          type="range"
          className="bf-range bf-range--min"
          min={0}
          max={LAST}
          step={1}
          value={minIdx}
          onChange={(e) => setMin(Number(e.target.value))}
          aria-label="Minimum budget slider"
        />
        <input
          type="range"
          className="bf-range bf-range--max"
          min={0}
          max={LAST}
          step={1}
          value={maxIdx}
          onChange={(e) => setMax(Number(e.target.value))}
          aria-label="Maximum budget slider"
        />
      </div>

      <div className="bf-footer">
        <span className="bf-readout">
          {minIdx === 0 && maxIdx === LAST
            ? "Any budget"
            : `${labelFor(minIdx)} – ${labelFor(maxIdx)}`}
        </span>
        {onDone && (
          <button type="button" className="bf-done" onClick={onDone}>
            Done
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(BudgetFilter);