import { Section, Row } from "./SharedUI";
import { safeText, fmtDate } from "../../../../utils/formatters";

const DetailsTab = ({ property }) => (
  <div className="tab-content">
    <Section title="Unit">
      <Row label="BHK" value={property.bhk ? `${property.bhk} BHK` : "—"} />
      <Row label="Bathrooms" value={safeText(property.bathrooms)} />
      <Row label="Balconies" value={safeText(property.balconies)} />
      <Row label="Parkings" value={safeText(property.parkings)} />
    </Section>

    <Section title="Building">
      <Row label="Floor" value={safeText(property.floor)} />
      <Row label="Total Floors" value={safeText(property.totalFloors)} />
      <Row label="Wing / Tower" value={[property.wing, property.tower].filter(Boolean).join(" / ") || "—"} />
      <Row label="Phase" value={safeText(property.phase)} />
    </Section>

    <Section title="Specs">
      <Row label="Furnishing" value={safeText(property.furnishing)} />
      <Row label="Facing" value={safeText(property.facing)} />
      <Row label="Age of Property" value={safeText(property.ageOfProperty)} />
      <Row label="Units Available" value={safeText(property.unitsAvailable)} />
      <Row label="Available From" value={fmtDate(property.reraDate)} />
    </Section>
  </div>
);

export default DetailsTab;