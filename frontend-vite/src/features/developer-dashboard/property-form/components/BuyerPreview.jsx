// features/developer-dashboard/property-form/components/BuyerPreview.jsx
// "How buyers will see it": the listing's column in the compare view, bound
// to the live form values. Watches only the fields it shows, so typing
// elsewhere doesn't re-render it. Everything renders as plain text.
import { useFormContext, useWatch } from "react-hook-form";
import { AREA_UNIT_LABELS } from "../../../../assests/constants/propertyFormConstants";

const WATCHED = [
  "title", "price", "area", "bhk", "propertyType",
  "locality", "city", "possessionStatus", "reraDate", "reraApproved", "reraNumber",
];

const MONTH_YEAR = new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" });

const formatINR = (val) => {
  const num = Number(val);
  if (val === "" || val == null || Number.isNaN(num) || num <= 0) return "";
  if (num >= 1_00_00_000) return `₹${(num / 1_00_00_000).toFixed(2)} Cr`;
  if (num >= 1_00_000) return `₹${(num / 1_00_000).toFixed(2)} L`;
  return `₹${num.toLocaleString("en-IN")}`;
};

const formatDate = (val) => {
  if (!val) return "";
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? "" : MONTH_YEAR.format(d);
};

// Line drawing of three buildings, shown until photo uploads exist
const BuildingsDrawing = () => (
  <svg viewBox="0 0 160 80" className="spf-preview__drawing" aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round">
      <path d="M8 74h144" />
      <rect x="22" y="38" width="26" height="36" />
      <path d="M28 46h14M28 54h14M28 62h14" />
      <rect x="62" y="10" width="36" height="64" className="spf-preview__drawing-accent" />
      <path d="M70 20h6M84 20h6M70 30h6M84 30h6M70 40h6M84 40h6M70 50h6M84 50h6M76 74V62h8v12" />
      <rect x="112" y="28" width="28" height="46" />
      <path d="M118 36h16M118 44h16M118 52h16M118 60h16" />
    </g>
  </svg>
);

const BuyerPreview = () => {
  const { control } = useFormContext();
  const [
    title, price, area, bhk, propertyType,
    locality, city, possessionStatus, reraDate, reraApproved, reraNumber,
  ] = useWatch({ control, name: WATCHED });

  const areaText = area?.value
    ? `${Number(area.value).toLocaleString("en-IN")} ${AREA_UNIT_LABELS[area.unit] || area.unit || ""}`.trim()
    : "";
  const config = [bhk && `${bhk} BHK`, propertyType].filter(Boolean).join(" ");
  const possession = [possessionStatus, formatDate(reraApproved ? reraDate : "")].filter(Boolean).join(", ");

  const rows = [
    ["Price", formatINR(price)],
    ["Area", areaText],
    ["Configuration", config],
    ["Location", [locality, city].filter(Boolean).join(", ")],
    ["Possession", possession],
    ["RERA number", reraApproved ? reraNumber : ""],
  ];

  return (
    <section className="spf-rail-card" aria-labelledby="spf-preview-heading">
      <h2 id="spf-preview-heading" className="spf-rail-card__title">How buyers will see it</h2>
      <p className="spf-rail-card__lead">
        This is your column when buyers compare projects. Empty rows show as “Not listed”.
      </p>

      <div className="spf-preview">
        <div className="spf-preview__photo">
          <BuildingsDrawing />
          <p>Your first photo shows here once photo uploads are available.</p>
        </div>
        <div className="spf-preview__head">
          <span className="spf-preview__tag">For sale</span>
          <p className="spf-preview__title">{title?.trim() || "Your listing title"}</p>
        </div>
        <dl className="spf-preview__rows">
          {rows.map(([label, value]) => (
            <div key={label} className="spf-preview__row">
              <dt>{label}</dt>
              <dd className={value ? undefined : "is-empty"}>{value || "Not listed"}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};

export default BuyerPreview;
