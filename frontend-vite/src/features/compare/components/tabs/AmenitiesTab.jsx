import { AmenityGroup } from "./SharedUI";

const AmenitiesTab = ({ property }) => (
  <div className="tab-content">
    <AmenityGroup title="Amenities" items={property.amenities} />
    <AmenityGroup title="Facilities" items={property.facilities} />
    <AmenityGroup title="Security" items={property.security} />
  </div>
);

export default AmenitiesTab;