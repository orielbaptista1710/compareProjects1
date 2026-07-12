import React from "react";
import Slider from "react-slick";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { fallbackImg } from "../../../../utils/propertyHelpers";

const PropertyLightbox = ({ media, initialIndex, onClose }) => {
  return (
    <div className="lightbox-overlay" role="dialog" aria-modal="true" aria-label="Property gallery lightbox">
      <button className="lightbox-close" onClick={onClose} aria-label="Close gallery">
        <X size={24} strokeWidth={2} />
      </button>

      <div className="lightbox-slider-container">
        <Slider
          initialSlide={initialIndex}
          infinite
          slidesToShow={1}
          slidesToScroll={1}
          dots
          arrows
          adaptiveHeight
          nextArrow={<button className="slick-next" aria-label="Next image" type="button"><ChevronRight size={28} color="#fff" /></button>}
          prevArrow={<button className="slick-prev" aria-label="Previous image" type="button"><ChevronLeft size={28} color="#fff" /></button>}
        >
          {media.map((item, idx) => (
            <div key={idx} className="lightbox-slide">
              {typeof item === "string" && item.endsWith(".mp4") ? (
                <video src={item} controls preload="metadata" style={{ maxHeight: "80vh" }} />
              ) : (
                <img
                  src={item}
                  alt={`Property media ${idx + 1}`}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => (e.target.src = fallbackImg)}
                />
              )}
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
};

export default PropertyLightbox;