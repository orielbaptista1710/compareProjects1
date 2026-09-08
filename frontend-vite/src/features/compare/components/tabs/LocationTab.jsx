import { ArrowRight } from "lucide-react";
import { Section, Row} from "./SharedUI";
import { safeText } from "../../../../utils/formatters";

const LocationTab = ({ property }) => (
  <div className="tab-content">
    <Section title="Address">
      <Row label="State" value={safeText(property.state)} />
      <Row label="City" value={safeText(property.city)} />
      <Row label="Locality" value={safeText(property.locality)} />
      <Row label="Pincode" value={safeText(property.pincode)} />
      <Row label="Address" value={safeText(property.address)} />
    </Section>

    {property.landmarks?.length > 0 && (
      <Section title="Landmarks">
        {property.landmarks.map((lm, i) => (
          <Row key={i} label={`Landmark ${i + 1}`} value={lm.name || "—"} />
        ))}
      </Section>
    )}

    {property.mapLink && (
      <a href={property.mapLink} target="_blank" rel="noopener noreferrer" className="map-link">
        View on Map <ArrowRight size={13} strokeWidth={1.5} />
      </a>
    )}
  </div>
);

export default LocationTab;