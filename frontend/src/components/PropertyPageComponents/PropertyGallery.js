// src/components/PropertyGallery.js
import React, { useState, useCallback, useEffect } from "react";
import Slider from "react-slick";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./PropertyGallery.css";

const PropertyGallery = ({ coverImage, galleryImages = [], mediaFiles = [] }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Merge all media
  const allMedia = [
    ...(coverImage ? [coverImage] : []),
    ...(galleryImages || []),
    ...(mediaFiles?.map((m) => m.src) || []),
  ];

  const openLightbox = useCallback((index) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  // 🔹 Close on ESC key
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, closeLightbox]);

  return (
    <div className="gallery-section">
      {/* ✅ Main Image */}
      {allMedia.length > 0 && (
        <div
          className="main-image"
          onClick={() => openLightbox(0)}
          role="button"
          tabIndex={0}
          aria-label="Open property gallery"
          onKeyPress={(e) => e.key === "Enter" && openLightbox(0)}
        >
          <img
            src={allMedia[0]}
            alt="Main property view"
            loading="lazy"
            decoding="async"
          />
        </div>
      )}

      {/* ✅ Thumbnails */}
      {galleryImages.length > 0 && (
        <div className="thumbnail-grid">
          {galleryImages.slice(0, 2).map((img, idx) => (
            <div
              key={idx}
              className="thumbnail"
              onClick={() => openLightbox(idx + 1)}
              role="button"
              tabIndex={0}
              aria-label={`Open gallery image ${idx + 1}`}
              onKeyPress={(e) => e.key === "Enter" && openLightbox(idx + 1)}
            >
              <img
                src={img}
                alt={`Property gallery view ${idx + 1}`}
                loading="lazy"
                decoding="async"
              />
            </div>
          ))}
        </div>
      )}

      {/* ✅ Lightbox Overlay */}
      {lightboxOpen && (
        <div
          className="lightbox-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Property gallery lightbox"
        >
          <button
            className="lightbox-close"
            onClick={closeLightbox}
            aria-label="Close gallery"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>

          <div className="lightbox-slider-container">
            <Slider
              initialSlide={currentImageIndex}
              infinite
              slidesToShow={1}
              slidesToScroll={1}
              dots
              arrows
              adaptiveHeight
              nextArrow={
                <button
                  className="slick-next"
                  aria-label="Next image"
                  type="button"
                >
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              }
              prevArrow={
                <button
                  className="slick-prev"
                  aria-label="Previous image"
                  type="button"
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>
              }
            >
              {allMedia.map((media, idx) => (
                <div key={idx} className="lightbox-slide">
                  {media.endsWith(".mp4") ? (
                    <video
                      src={media}
                      controls
                      preload="metadata"
                      style={{ maxHeight: "80vh" }}
                    />
                  ) : (
                    <img
                      src={media}
                      alt={`Property media ${idx + 1}`}
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                </div>
              ))}
            </Slider>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyGallery;
