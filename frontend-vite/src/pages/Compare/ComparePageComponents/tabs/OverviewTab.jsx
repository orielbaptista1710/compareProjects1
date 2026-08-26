import { Section, Row } from "./SharedUI";
import { safeText, fmtArea } from "../../../../utils/formatters";
import { formatCurrencyShort } from "../../../../utils/formatters";

const OverviewTab = ({ property }) => (
  <div className="tab-content">
    <Section title="Pricing">
      <Row label="Price" value={formatCurrencyShort(property.price)} highlight />
      <Row label="Price / Sq.ft" value={property.pricePerSqft ? `₹${property.pricePerSqft.toLocaleString("en-IN")}` : "—"} />
      <Row label="EMI Starts" value={property.emiStarts ? `₹${property.emiStarts.toLocaleString("en-IN")}` : "—"} />
    </Section>

    <Section title="Property">
      <Row label="Type" value={safeText(property.propertyType)} />
      <Row label="Category" value={safeText(property.propertyGroup)} />
      <Row label="BHK" value={property.bhk ? `${property.bhk} BHK` : "—"} />
      <Row label="Area" value={fmtArea(property.area)} />
    </Section>

    <Section title="Status">
      <Row label="Possession" value={safeText(property.possessionStatus)} />
      <Row label="RERA Approved" value={property.reraApproved ? "Yes ✓" : "No"} />
      {property.reraApproved && property.reraNumber && (
        <Row label="RERA No." value={property.reraNumber} />
      )}
    </Section>

    {property.amenities?.length > 0 && (
      <Section title="Top Amenities">
        <div className="chip-list">
          {property.amenities.slice(0, 6).map((a, i) => (
            <span key={i} className="chip">{a}</span>
          ))}
        </div>
      </Section>
    )}
  </div>
);

export default OverviewTab;