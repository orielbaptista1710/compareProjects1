// frontend/src/pages/PropertyPage/PropertyPageComponents/RelatedProperties
// Additional "related properties" strip shown on the PropertyPage
import React, { useEffect, useState, useRef } from "react";
import "./RelatedProperties.css";
import { formatCurrencyShort } from "../../../utils/formatters";
import { useNavigate } from "react-router-dom";
import { Image as ImageIcon, Home as HomeIcon, ChevronRight } from "lucide-react";
import { fallbackImg, getPropertyImage, getPropertyLocation } from "../../../utils/propertyHelpers";

function RelatedProperties({ propertyId }) {
  const [data, setData] = useState([]);
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!propertyId) return;
    let cancelled = false;

    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/properties/related/${propertyId}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setData(Array.isArray(json) ? json : []);
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  const scrollNext = () => {
    scrollRef.current?.scrollBy({ left: 300, behavior: "smooth" });
  };

  if (!data.length) return null;

  return (
    <div className="rp-wrapper">
      <h2 className="rp-title">More from this Project</h2>

      <div className="rp-scroll-container">
        <div className="rp-scroll" ref={scrollRef}>
          {data.map((p) => {
            const hasImage = Boolean(p.coverImage?.url || p.galleryImages?.[0]?.url);
            return (
              <div
                key={p._id}
                className="rp-card"
                onClick={() => navigate(`/property/${p._id}`)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === "Enter" && navigate(`/property/${p._id}`)}
              >
                <div className="rp-image">
                  {hasImage ? (
                    <>
                      <img
                        src={getPropertyImage(p)}
                        alt={p.title}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => (e.target.src = fallbackImg)}
                      />
                    </>
                  ) : (
                    <div className="rp-no-image">
                      <HomeIcon size={30} strokeWidth={1.5} />
                      <span>No Image Available</span>
                    </div>
                  )}
                </div>

                <div className="rp-body">
                  <div className="rp-type">{p.bhk} BHK Flat</div>

                  <div className="rp-price-row">
                    <span className="rp-price">{formatCurrencyShort(p.price)}</span>
                    <span className="rp-sep">|</span>
                    <span className="rp-area">{p.area?.value} sqft</span>
                  </div>

                  <div className="rp-name">{p.title}</div>
                  <div className="rp-location">{getPropertyLocation(p)}</div>
                </div>

                <button className="rp-btn">
                  Contact {p.developerName ? "Builder" : "Agent"}
                </button>

              </div>
            );
          })}
        </div>

        <button
          className="rp-scroll-btn"
          onClick={scrollNext}
          aria-label="See more properties"
          type="button"
        >
          <ChevronRight size={22} strokeWidth={2.5} />
        </button>
      </div>

      <div className="rp-footer">
        View more properties →
      </div>

    </div>
  );
}

export default RelatedProperties;