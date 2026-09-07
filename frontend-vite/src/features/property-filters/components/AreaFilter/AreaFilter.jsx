// components/filters/AreaFilter.jsx (or wherever it lives)

import React, { useId } from "react";
import {
  AREA_UNIT_KEYS,
  AREA_UNIT_LABELS,
} from "../../../../assests/constants/propertyFormConstants"; 
import { resolveUnit } from "../../../../utils/areaFilterUtils";
import "./AreaFilter.css";

/* ================================
   Constants (component‑specific)
================================ */

/** UI fallback bounds — overridden by areaBounds from the API */
const DEFAULT_BOUNDS = {
  sqft:     { min: 0, max: 10_000, step: 50  },
  sqmts:    { min: 0, max: 1_000,  step: 5   },
  guntas:   { min: 0, max: 100,    step: 1   },
  hectares: { min: 0, max: 50,     step: 0.5 },
  acres:    { min: 0, max: 50,     step: 0.5 },
};

const STEP_FOR_UNIT = {
  sqft: 50, sqmts: 5, guntas: 1, hectares: 0.5, acres: 0.5,
};

const PRESETS = {
  sqft: [
    { label: "< 500",  min: 0,    max: 500   },
    { label: "500–1k", min: 500,  max: 1000  },
    { label: "1k–2k",  min: 1000, max: 2000  },
    { label: "2k–5k",  min: 2000, max: 5000  },
    { label: "5k+",    min: 5000, max: 10000 },
  ],
  sqmts: [
    { label: "< 50",    min: 0,   max: 50   },
    { label: "50–100",  min: 50,  max: 100  },
    { label: "100–300", min: 100, max: 300  },
    { label: "300+",    min: 300, max: 1000 },
  ],
  guntas: [
    { label: "< 10",  min: 0,  max: 10  },
    { label: "10–30", min: 10, max: 30  },
    { label: "30–60", min: 30, max: 60  },
    { label: "60+",   min: 60, max: 100 },
  ],
  hectares: [
    { label: "< 1",  min: 0,  max: 1  },
    { label: "1–5",  min: 1,  max: 5  },
    { label: "5–20", min: 5,  max: 20 },
    { label: "20+",  min: 20, max: 50 },
  ],
  acres: [
    { label: "< 1",  min: 0,  max: 1  },
    { label: "1–5",  min: 1,  max: 5  },
    { label: "5–20", min: 5,  max: 20 },
    { label: "20+",  min: 20, max: 50 },
  ],
};

/* ================================
   Helpers
================================ */


/** Merge API bounds with step values */
const buildBounds = (unit, areaBoundsFromAPI) => {
  const api   = areaBoundsFromAPI?.[unit];
  const def   = DEFAULT_BOUNDS[unit];
  const step  = STEP_FOR_UNIT[unit] ?? 1;
  return {
    min:  api?.min ?? def.min,
    max:  api?.max ?? def.max,
    step,
  };
};

const fmtValue = (value, unit, absMax) => {
  if (value == null || isNaN(value)) return "—";
  if (value >= absMax) return "Any";
  if (unit === "sqft") {
    if (value >= 1000)
      return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
    return String(value);
  }
  return value % 1 === 0 ? String(value) : value.toFixed(1);
};

/**
 * Sanitize incoming value — handles dirty DB shapes:
 *   max as "330 - 575", unknown units, min === max
 */
const sanitizeValue = (raw, bounds) => {
  if (raw == null) return null;

  const unit   = resolveUnit(raw.unit);
  const b      = bounds ?? DEFAULT_BOUNDS[unit];

  let minVal = raw.min != null ? Number(raw.min) : b.min;
  let maxVal;

  if (typeof raw.max === "string" && /\d\s*-\s*\d/.test(raw.max)) {
    const parts = raw.max.split("-").map((s) => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      minVal = parts[0];
      maxVal = parts[1];
    } else {
      maxVal = b.max;
    }
  } else {
    maxVal = raw.max != null ? Number(raw.max) : b.max;
  }

  minVal = Math.max(b.min, Math.min(minVal, b.max));
  maxVal = Math.max(b.min, Math.min(maxVal, b.max));

  if (minVal >= maxVal) {
    minVal = Math.max(b.min, maxVal - (b.step ?? 1) * 4);
  }

  return { min: minVal, max: maxVal, unit };
};

/* ================================
   Component
================================ */

const AreaFilter = ({ value, onChange, areaBounds }) => {
  const uid = useId();

  const unit    = resolveUnit(value?.unit);
  const bounds  = buildBounds(unit, areaBounds);
  const safe    = sanitizeValue(value, bounds);
  const presets = PRESETS[unit] ?? PRESETS.sqft;

  const minVal = safe?.min ?? bounds.min;
  const maxVal = safe?.max ?? bounds.max;

  const range = bounds.max - bounds.min || 1; // avoid divide-by-zero
  const pLo   = ((minVal - bounds.min) / range) * 100;
  const pHi   = ((maxVal - bounds.min) / range) * 100;

  /* ── Handlers ── */

  const handleMinChange = (e) => {
  const newMin = Number(e.target.value);

  if (newMin >= maxVal) {
    return;
  }

  onChange({
    min: newMin,
    max: maxVal,
    unit,
  });
};

  const handleMaxChange = (e) => {
  const newMax = Number(e.target.value);

  if (newMax <= minVal) {
    return;
  }

  onChange({
    min: minVal,
    max: newMax,
    unit,
  });
};

  const handleUnitChange = (newUnit) => {
  if (newUnit === unit) {
    return;
  }

  const newBounds = buildBounds(newUnit, areaBounds);

  onChange({
    min: newBounds.min,
    max: newBounds.max,
    unit: newUnit,
  });
};

  const handlePreset = (preset) => {
  onChange({
    min: preset.min,
    max: preset.max,
    unit,
  });
};

 const handleClear = () => {
  onChange(null);
};
  
  const isActive =
    safe != null && (safe.min > bounds.min || safe.max < bounds.max);

  /* ── Render ── */
  return (
    <div className="af-root">

      {/* Min / Max readout */}
      <div className="af-readout">
        <div className="af-readout-item">
          <span className="af-readout-label">Min</span>
          <strong className="af-readout-value">
            {fmtValue(minVal, unit, bounds.max)}{" "}
            <span className="af-readout-unit">{AREA_UNIT_LABELS[unit]}</span>
          </strong>
        </div>
        <span className="af-readout-sep">–</span>
        <div className="af-readout-item af-readout-item--right">
          <span className="af-readout-label">Max</span>
          <strong className="af-readout-value">
            {fmtValue(maxVal, unit, bounds.max)}
            {maxVal < bounds.max && (
              <span className="af-readout-unit"> {AREA_UNIT_LABELS[unit]}</span>
            )}
          </strong>
        </div>
      </div>

      {/* Dual-handle slider */}
      <div className="af-slider-wrap" role="group" aria-label="Area range">
        <div className="af-track">
          <div
            className="af-fill"
            style={{ left: `${pLo}%`, width: `${Math.max(0, pHi - pLo)}%` }}
          />
        </div>
        <input
          id={`${uid}-min`}
          className="af-range af-range--min"
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={bounds.step}
          value={minVal}
          onChange={handleMinChange}
          aria-label="Minimum area"
          aria-valuetext={`${fmtValue(minVal, unit, bounds.max)} ${AREA_UNIT_LABELS[unit]}`}
        />
        <input
          id={`${uid}-max`}
          className="af-range af-range--max"
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={bounds.step}
          value={maxVal}
          onChange={handleMaxChange}
          aria-label="Maximum area"
          aria-valuetext={`${fmtValue(maxVal, unit, bounds.max)} ${AREA_UNIT_LABELS[unit]}`}
        />
      </div>

      {/* Quick-select presets */}
      <div className="af-presets" role="group" aria-label="Area presets">
        {presets.map((p) => {
          const isMatch = safe?.min === p.min && safe?.max === p.max;
          return (
            <button
              key={p.label}
              type="button"
              className={`af-preset ${isMatch ? "active" : ""}`}
              onClick={() => handlePreset(p)}
              aria-pressed={isMatch}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Unit selector */}
      <div className="af-unit-row">
        <span className="af-unit-label">Unit</span>
        <div className="af-unit-btns" role="group" aria-label="Area unit">
          {AREA_UNIT_KEYS.map((u) => (
            <button
              key={u}
              type="button"
              className={`af-unit-btn ${u === unit ? "active" : ""}`}
              onClick={() => handleUnitChange(u)}
              aria-pressed={u === unit}
            >
              {AREA_UNIT_LABELS[u]}
            </button>
          ))}
        </div>
      </div>

      {/* Clear — only when actively filtering */}
      {isActive && (
        <button
          type="button"
          className="af-clear"
          onClick={handleClear}
          aria-label="Clear area filter"
        >
          Clear area filter
        </button>
      )}

    </div>
  );
};

export default React.memo(AreaFilter);