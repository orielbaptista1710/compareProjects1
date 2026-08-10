// src/pages/PropertyPage/PropertyPageComponents/FloorPlanView 

import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import {
  Layers, Ruler, Bed, Bath,
  Building2, IndianRupee, X, ZoomIn,
} from "lucide-react";
import { formatCurrencyShort } from "../../../utils/formatters";
// import { useOutsideClick } from "../../../hooks/useOutsideClick";
// import { useEscapeKey } from "../../../hooks/useEscapeKey";

import "./FloorPlanView.css";

// ── Helpers ───────────────────────────────────────────────────
const formatFloorLabel = (i) => {
  const suffixes = ["st", "nd", "rd"];
  const n = i + 1;
  const suffix = n <= 3 ? suffixes[i] : "th";
  return `${n}${suffix} Floor`;
};

const toSqft = (sqm)  => sqm * 10.764;
const toSqm  = (sqft) => sqft / 10.764;

const formatArea = (value, unit) => {
  if (!value && value !== 0) return "—";
  const rounded = unit === "sqft" ? Math.round(value) : parseFloat(value.toFixed(1));
  return `${new Intl.NumberFormat("en-IN").format(rounded)} ${unit === "sqft" ? "sq.ft" : "sq.m"}`;
};

// ── Lightbox ──────────────────────────────────────────────────
const Lightbox = ({ src, alt, onClose }) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fp-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Floor plan enlarged view"
      onClick={onClose}
    >
      <div className="fp-lightbox__inner" onClick={(e) => e.stopPropagation()}>
        <button className="fp-lightbox__close" onClick={onClose} aria-label="Close">
          <X size={20} strokeWidth={2.5} />
        </button>
        <img src={src} alt={alt} className="fp-lightbox__img" />
      </div>
    </div>
  );
};

// ── Summary item ──────────────────────────────────────────────
const SummaryRow = ({ Icon, label, value }) => (
  <div className="fp-summary-row">
    {Icon && <Icon size={15} strokeWidth={2} className="fp-summary-row__ico" />}
    <span className="fp-summary-row__lbl">{label}</span>
    <span className="fp-summary-row__val">{value}</span>
  </div>
);

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────
const FloorPlanView = ({ floorPlans = [], property = {} }) => {
  const [selectedFloor, setSelectedFloor] = useState(0);
  const [displayUnit,   setDisplayUnit]   = useState("sqft");
  const [lightboxSrc,   setLightboxSrc]   = useState(null);

  const currentFloor = useMemo(
    () => floorPlans[selectedFloor] || {},
    [floorPlans, selectedFloor]
  );

  // Sync unit from floor data if present
  useEffect(() => {
    if (currentFloor.unitType) {
      setDisplayUnit(currentFloor.unitType === "sqm" ? "sqm" : "sqft");
    }
  }, [currentFloor.unitType]);

  // Normalise gallery images: API returns [{url}] objects OR strings
  const galleryImages = useMemo(() => {
    const imgs = property.galleryImages || [];
    return imgs.map((img) => (typeof img === "string" ? img : img?.url)).filter(Boolean);
  }, [property.galleryImages]);

  const openLightbox  = useCallback((src) => setLightboxSrc(src), []);
  const closeLightbox = useCallback(() => setLightboxSrc(null), []);

  // Derived area values in the chosen unit
  const area = useMemo(() => {
    const builtUp  = currentFloor.floorArea?.builtUp  ?? null;
    const carpet   = currentFloor.floorArea?.carpet   ?? null;
    const terrace  = currentFloor.floorArea?.terrace  ?? null;
    const srcUnit  = currentFloor.unitType === "sqm" ? "sqm" : "sqft";

    const convert = (v) => {
      if (v === null) return null;
      if (srcUnit === displayUnit) return v;
      return displayUnit === "sqft" ? toSqft(v) : toSqm(v);
    };

    return {
      builtUp:  builtUp  !== null ? formatArea(convert(builtUp), displayUnit)  : null,
      carpet:   carpet   !== null ? formatArea(convert(carpet), displayUnit)   : null,
      terrace:  terrace  !== null ? formatArea(convert(terrace), displayUnit)  : null,
    };
  }, [currentFloor, displayUnit]);

  const roomList = currentFloor.rooms ?? [];
  const bedroomCount = roomList.filter((r) => r.name?.toLowerCase().includes("bedroom")).length;
  const bathroomCount = roomList.filter((r) => r.name?.toLowerCase().includes("bath")).length;

  // Empty state (parent guards too, but keep as fallback)
  if (!floorPlans.length) {
    return (
      <div className="fp-empty" role="status">
        <Layers size={32} strokeWidth={1.2} />
        <span>No floor plans available</span>
      </div>
    );
  }

  return (
    <section className="fp-root" aria-label="Floor Plans">

      {/* ── Floor selector (hidden if only 1 plan) ── */}
      {floorPlans.length > 1 && (
        <div className="fp-floor-selector" role="tablist" aria-label="Select floor">
          {floorPlans.map((fp, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={selectedFloor === i}
              className={`fp-floor-btn${selectedFloor === i ? " fp-floor-btn--active" : ""}`}
              onClick={() => setSelectedFloor(i)}
            >
              {formatFloorLabel(i)}
              {fp.type && <span className="fp-floor-btn__badge">{fp.type}</span>}
            </button>
          ))}
        </div>
      )}

      {/* ── Main layout ── */}
      <div className="fp-main">

        {/* Floor plan image */}
        <div className="fp-visual">
          {currentFloor.imageUrl ? (
            <div
              className="fp-img-wrap"
              role="button"
              tabIndex={0}
              aria-label="Click to enlarge floor plan"
              onClick={() => openLightbox(currentFloor.imageUrl)}
              onKeyDown={(e) => e.key === "Enter" && openLightbox(currentFloor.imageUrl)}
            >
              <img
                src={currentFloor.imageUrl}
                alt={`Floor plan — ${formatFloorLabel(selectedFloor)}`}
                className="fp-img"
                loading="lazy"
                decoding="async"
              />
              <div className="fp-img-zoom" aria-hidden="true">
                <ZoomIn size={20} strokeWidth={2} />
                <span>Enlarge</span>
              </div>
            </div>
          ) : (
            <div className="fp-img-placeholder" aria-hidden="true">
              <Layers size={36} strokeWidth={1.2} />
              <span>Image not available</span>
            </div>
          )}
        </div>

        {/* Specs panel */}
        <aside className="fp-specs">
          {/* Unit toggle */}
          <div className="fp-unit-toggle">
            <span className="fp-unit-toggle__label">Area in</span>
            <div className="fp-unit-toggle__btns" role="group" aria-label="Toggle area unit">
              {["sqft", "sqm"].map((u) => (
                <button
                  key={u}
                  className={`fp-unit-btn${displayUnit === u ? " fp-unit-btn--active" : ""}`}
                  onClick={() => setDisplayUnit(u)}
                  aria-pressed={displayUnit === u}
                >
                  {u === "sqft" ? "sq.ft" : "sq.m"}
                </button>
              ))}
            </div>
          </div>

          <div className="fp-summary">
            {area.builtUp  && <SummaryRow Icon={Ruler}       label="Built-up Area"  value={area.builtUp} />}
            {area.carpet   && <SummaryRow Icon={Ruler}       label="Carpet Area"    value={area.carpet} />}
            {area.terrace  && <SummaryRow Icon={Ruler}       label="Terrace Area"   value={area.terrace} />}
            {floorPlans.length > 0 && (
              <SummaryRow Icon={Building2} label="Total Floors" value={floorPlans.length} />
            )}
            {bedroomCount > 0  && <SummaryRow Icon={Bed}   label="Bedrooms"   value={bedroomCount} />}
            {bathroomCount > 0 && <SummaryRow Icon={Bath}  label="Bathrooms"  value={bathroomCount} />}
            {property.price    && (
              <SummaryRow Icon={IndianRupee} label="Price" value={formatCurrencyShort(property.price)} />
            )}
          </div>

          {/* Room breakdown */}
          {roomList.length > 0 && (
            <div className="fp-rooms">
              <h4 className="fp-rooms__heading">Room Details</h4>
              <div className="fp-rooms__grid">
                {roomList.map((room, i) => (
                  <div className="fp-room" key={i}>
                    <span className="fp-room__name">{room.name || "Room"}</span>
                    {room.dimensions && (
                      <span className="fp-room__dim">{room.dimensions}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Gallery thumbnails (only when present) */}
      {galleryImages.length > 0 && (
        <div className="fp-gallery">
          <h4 className="fp-gallery__heading">Property Photos</h4>
          <div className="fp-gallery__grid">
            {galleryImages.slice(0, 6).map((src, i) => (
              <button
                key={i}
                className="fp-gallery__thumb"
                onClick={() => openLightbox(src)}
                aria-label={`View photo ${i + 1}`}
              >
                <img src={src} alt={`Property view ${i + 1}`} loading="lazy" decoding="async" />
                {i === 5 && galleryImages.length > 6 && (
                  <div className="fp-gallery__more">+{galleryImages.length - 6}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxSrc && (
        <Lightbox
          src={lightboxSrc}
          alt="Enlarged floor plan or property photo"
          onClose={closeLightbox}
        />
      )}
    </section>
  );
};

export default React.memo(FloorPlanView);