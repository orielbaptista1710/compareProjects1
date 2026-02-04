// src/components/PropertyGallery.js
import React, { useState, useCallback, useEffect, memo } from "react";
import Slider from "react-slick";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./PropertyGallery.css";

// Temporary placeholder image URL
const PLACEHOLDER_IMG = "https://placehold.co/600x400/000000/FFFFFF/png";

const PropertyGallery = ({ coverImage, galleryImages = [], mediaFiles = [] }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Merge all media files safely with fallback
const allMedia = [
  ...(coverImage?.url ? [coverImage.url] : []),
  ...(galleryImages?.map((img) => img?.url).filter(Boolean) || []),
  ...(mediaFiles?.map((m) => m?.src).filter(Boolean) || [])
].map((url) => url || PLACEHOLDER_IMG);


  const openLightbox = useCallback((index) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  // Close lightbox on ESC
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, closeLightbox]);

  if (!allMedia.length) {
    return <p className="no-media">No property images or videos available.</p>;
  }

  return (
    <div className="gallery-section">
      {/* Main Image */}
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
          onError={(e) => (e.target.src = PLACEHOLDER_IMG)} // fallback if broken
        />
      </div>

      {/* Thumbnails */}
      {galleryImages?.length > 0 && (
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
    src={img?.thumbnail || img?.url || PLACEHOLDER_IMG}
    alt={`Property gallery view ${idx + 1}`}
    loading="lazy"
    decoding="async"
    onError={(e) => (e.target.src = PLACEHOLDER_IMG)}
  />
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Overlay */}
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
            <X size={22} color="#fff" />
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
                  <ChevronRight size={28} color="#fff" />
                </button>
              }
              prevArrow={
                <button
                  className="slick-prev"
                  aria-label="Previous image"
                  type="button"
                >
                  <ChevronLeft size={28} color="#fff" />
                </button>
              }
            >
              {allMedia.map((media, idx) => (
                <div key={idx} className="lightbox-slide">
                  {typeof media === "string" && media.endsWith(".mp4") ? (
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
                      onError={(e) => (e.target.src = PLACEHOLDER_IMG)}
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

export default memo(PropertyGallery);
