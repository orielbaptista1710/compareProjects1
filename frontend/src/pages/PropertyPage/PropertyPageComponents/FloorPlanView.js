import React, { useState, useMemo, useEffect } from "react";
import {
  Layers,
  Ruler,
  Bed,
  Bath,
  Building2,
  DollarSign,
  Images,
  X,
} from "lucide-react";
import "./FloorPlanView.css";

const FloorPlanView = ({ floorPlans = [], property = {} }) => {
  const [selectedFloor, setSelectedFloor] = useState(0);
  const [selectedTab, setSelectedTab] = useState("floorplan");
  const [unit, setUnit] = useState("sqm"); // sqm | sqft
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Always pick a valid floorPlan object
  const currentFloor = useMemo(
    () => floorPlans[selectedFloor] || {},
    [floorPlans, selectedFloor]
  );

  const totalArea = currentFloor.floorArea?.builtUp ?? 0;
  const roomList = currentFloor.rooms ?? [];

  const hasGalleryImages =
    Array.isArray(property.galleryImages) && property.galleryImages.length > 0;

  // Set unit from floor's unitType if present
  useEffect(() => {
    if (currentFloor.unitType) setUnit(currentFloor.unitType);
  }, [selectedFloor, currentFloor.unitType]);

  const formatFloorLabel = (index) => {
    if (index === 0) return "1st floor";
    if (index === 1) return "2nd floor";
    if (index === 2) return "3rd floor";
    return `${index + 1}th floor`;
  };

  const roomAreas = useMemo(() => {
    return roomList.map((room) => {
      if (!room.dimensions) return 0;
      const [w, h] = room.dimensions.split("x").map((d) => parseFloat(d.trim()) || 0);
      return w * h;
    });
  }, [roomList]);

  const convertArea = (area) => {
    if (!area) return "-";
    if (unit === "sqm") return `${area.toFixed(1)} m²`;
    return `${(area * 10.764).toFixed(0)} ft²`;
  };

  if (!floorPlans.length) {
    return (
      <div className="floor-plan-empty" role="status">
        No floor plans available
      </div>
    );
  }

  return (
    <section className="floor-plan-container" aria-labelledby="floorPlansHeading">
      <header className="floor-plan-header">
        <h2 id="floorPlansHeading">Floor Plans</h2>
        <nav className="floor-selector" aria-label="Select floor">
          {floorPlans.map((floor, index) => (
            <button
              key={index}
              type="button"
              className={`floor-btn ${selectedFloor === index ? "active" : ""}`}
              onClick={() => setSelectedFloor(index)}
              aria-pressed={selectedFloor === index}
            >
              {formatFloorLabel(index)}
              {floor.type && <span className="floor-type-badge">{floor.type}</span>}
            </button>
          ))}
        </nav>
      </header>

      <div className="floor-plan-content">
        {/* Floor plan image */}
        <figure className="floor-plan-visual">
          {currentFloor.imageUrl ? (
            <img
              src={currentFloor.imageUrl}
              alt={`Floor plan for ${formatFloorLabel(selectedFloor)}`}
              className="floor-plan-image"
              loading="lazy"
              onClick={() => {
                setLightboxOpen(true);
                setLightboxImage(currentFloor.imageUrl);
              }}
            />
          ) : (
            <div className="floor-plan-placeholder" aria-hidden="true">
              <Layers size={40} strokeWidth={1.5} />
              <p>Floor plan image not available</p>
            </div>
          )}
        </figure>

        {/* Floor plan details */}
        <aside className="floor-plan-details">
          {/* Room areas */}
          {roomAreas.length > 0 && (
            <section className="room-areas-section">
              <h3>Room Areas</h3>
              <div className="room-areas-grid">
                {roomAreas.map((area, idx) => (
                  <div key={idx} className="room-area-item">
                    <span className="area-value">{convertArea(area)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Summary */}
          <section className="floor-summary">
            {totalArea != null && (
              <div className="summary-item unit-toggle">
                <Ruler className="summary-icon" size={18} />
                <span className="summary-label">Total Area</span>
                <span className="summary-value">{convertArea(totalArea)}</span>
                <button
                  className="unit-switch"
                  onClick={() => setUnit(unit === "sqm" ? "sqft" : "sqm")}
                >
                  {unit === "sqm" ? "ft²" : "m²"}
                </button>
              </div>
            )}

            {currentFloor.floorArea?.carpet != null && (
              <div className="summary-item">
                <span className="summary-label">Carpet Area</span>
                <span className="summary-value">
                  {convertArea(currentFloor.floorArea.carpet)}
                </span>
              </div>
            )}

            {currentFloor.floorArea?.terrace != null && (
              <div className="summary-item">
                <span className="summary-label">Terrace Area</span>
                <span className="summary-value">
                  {convertArea(currentFloor.floorArea.terrace)}
                </span>
              </div>
            )}

            <div className="summary-item">
              <Building2 className="summary-icon" size={18} />
              <span className="summary-label">Floors</span>
              <span className="summary-value">{floorPlans.length}</span>
            </div>

            <div className="summary-item">
              <Bed className="summary-icon" size={18} />
              <span className="summary-label">Bedrooms</span>
              <span className="summary-value">
                {roomList.filter((r) =>
                  r.name?.toLowerCase().includes("bedroom")
                ).length || 0}
              </span>
            </div>

            <div className="summary-item">
              <Bath className="summary-icon" size={18} />
              <span className="summary-label">Bathrooms</span>
              <span className="summary-value">
                {roomList.filter((r) => r.name?.toLowerCase().includes("bath"))
                  .length || 0}
              </span>
            </div>

            {property.price != null && (
              <div className="summary-item price">
                <DollarSign className="summary-icon" size={18} />
                <span className="summary-label">Total Price</span>
                <span className="summary-value">
                  ${property.price.toLocaleString()}
                </span>
              </div>
            )}
          </section>
        </aside>
      </div>

      {/* Gallery */}
      {hasGalleryImages && (
        <section className="floor-image-gallery">
          <div className="gallery-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={selectedTab === "floorplan"}
              className={`gallery-tab ${selectedTab === "floorplan" ? "active" : ""}`}
              onClick={() => setSelectedTab("floorplan")}
            >
              Floor Plans
            </button>
            <button
              role="tab"
              aria-selected={selectedTab === "gallery"}
              className={`gallery-tab ${selectedTab === "gallery" ? "active" : ""}`}
              onClick={() => setSelectedTab("gallery")}
            >
              <Images size={16} className="gallery-icon" /> Gallery
            </button>
          </div>

          <div className="gallery-content">
            {selectedTab === "floorplan" && currentFloor.imageUrl && (
              <img
                src={currentFloor.imageUrl}
                alt={`Floor plan view for ${formatFloorLabel(selectedFloor)}`}
                className="gallery-image"
                loading="lazy"
                onClick={() => {
                  setLightboxOpen(true);
                  setLightboxImage(currentFloor.imageUrl);
                }}
              />
            )}

            {selectedTab === "gallery" &&
              property.galleryImages.map((image, idx) => (
                <img
                  key={idx}
                  src={image}
                  alt={`Property view ${idx + 1}`}
                  className="gallery-image"
                  loading="lazy"
                  onClick={() => {
                    setLightboxOpen(true);
                    setLightboxImage(image);
                  }}
                />
              ))}
          </div>
        </section>
      )}

      {/* Room details */}
      {roomList.length > 0 && (
        <section className="room-details">
          <h3>Room Details</h3>
          <div className="rooms-grid">
            {roomList.map((room, idx) => (
              <article key={idx} className="room-item">
                <h4>{room.name || "Room"}</h4>
                {room.dimensions && <p>Dimensions: {room.dimensions}</p>}
                {room.windowCount > 0 && <p>Windows: {room.windowCount}</p>}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div className="lightbox-overlay" onClick={() => setLightboxOpen(false)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setLightboxOpen(false)}>
              <X size={20} />
            </button>
            <img src={lightboxImage} alt="Expanded view" className="lightbox-image" />
          </div>
        </div>
      )}
    </section>
  );
};

export default React.memo(FloorPlanView);
