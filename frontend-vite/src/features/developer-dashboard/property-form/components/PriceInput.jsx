// components/PriceInput.jsx
// Amount + Lakh / Crore / Rupees picker for a price stored in whole rupees
// (FORM-06). The form value stays rupees, so drafts, the schema and the API
// don't change; this component only converts while typing.
import React, { useState } from "react";
import { PRICE_UNITS, splitPrice, toRupees, formatRupees, priceInWords } from "../../../listings/price";

/**
 * Controlled by react-hook-form's Controller.
 * @param {number|""} value  whole rupees
 * @param {(rupees: number|"") => void} onChange
 */
const PriceInput = ({ id, name, value, onChange, onBlur, inputRef, invalid, describedBy }) => {
  const [typed, setTyped] = useState(() => splitPrice(value));
  const [seen, setSeen] = useState(value);

  // The value changed from outside (an edit loaded, a draft restored, a reset):
  // show it in its best unit. Object.is, because a half-typed amount is NaN.
  if (!Object.is(value, seen)) {
    setSeen(value);
    if (!Object.is(value, toRupees(typed.amount, typed.unit))) setTyped(splitPrice(value));
  }

  const update = (amount, unit) => {
    const rupees = toRupees(amount, unit);
    setTyped({ amount, unit });
    setSeen(rupees);
    onChange(rupees);
  };

  // A saved or restored price can arrive as "7500000"
  const rupees = typeof value === "string" && value.trim() ? Number(value) : value;
  const valid = Number.isFinite(rupees) && rupees > 0;
  const words = valid ? priceInWords(rupees) : "";

  return (
    <>
      <div className="input-group">
        <input
          id={id}
          name={name}
          ref={inputRef}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={typed.amount}
          onChange={(e) => update(e.target.value, typed.unit)}
          onBlur={onBlur}
          placeholder={typed.unit === "crore" ? "e.g. 1.25" : typed.unit === "lakh" ? "e.g. 75" : "e.g. 7500000"}
          className="input-group__input"
          aria-invalid={invalid ? "true" : undefined}
          aria-describedby={describedBy}
        />
        <select
          value={typed.unit}
          onChange={(e) => update(typed.amount, e.target.value)}
          className="input-group__addon"
          aria-label="Price unit"
        >
          {PRICE_UNITS.map((u) => (
            <option key={u.value} value={u.value}>{u.label}</option>
          ))}
        </select>
      </div>
      {valid && (
        <span id={`${id}-amount`} className="field-hint" aria-live="polite">
          {formatRupees(rupees)}
          {words && ` (${words})`}
        </span>
      )}
    </>
  );
};

export default React.memo(PriceInput);
