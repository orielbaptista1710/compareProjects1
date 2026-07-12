// src/components/PropertyGallery
import React, { useState, useCallback, useEffect, memo, Suspense, lazy } from "react";
import "./PropertyGallery.css";
import { fallbackImg } from "../../../../utils/propertyHelpers";

const PropertyLightbox = lazy(() => import("./PropertyLightbox"));

const PropertyGallery = ({ coverImage, galleryImages = [], mediaFiles = [] }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Merge all media files safely with fallback
  const allMedia = [
    ...(coverImage?.url ? [coverImage.url] : []),
    ...(galleryImages?.map((img) => img?.url).filter(Boolean) || []),
    ...(mediaFiles?.map((m) => m?.src).filter(Boolean) || [])
  ].map((url) => url || fallbackImg);

  const openLightbox = useCallback((index) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const thumbnailCount = galleryImages?.filter((img) => img?.url)?.slice(0, 2).length || 0;

  const layoutClass =
    thumbnailCount === 0 ? "gallery-single" :
    thumbnailCount === 1 ? "gallery-two" : "";

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
    <div className={`gallery-section ${layoutClass}`}>
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
          onError={(e) => (e.target.src = fallbackImg)}
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
                src={img?.thumbnail || img?.url || fallbackImg}
                alt={`Property gallery view ${idx + 1}`}
                loading="lazy"
                decoding="async"
                onError={(e) => (e.target.src = fallbackImg)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Overlay */}
      {lightboxOpen && (
        <Suspense fallback={null}>
          <PropertyLightbox
            media={allMedia}
            initialIndex={currentImageIndex}
            onClose={closeLightbox}
          />
        </Suspense>
      )}
    </div>
  );
};

export default memo(PropertyGallery);