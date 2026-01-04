import React, {
  useState,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import FeaturedPropertyCard from "./FeaturedPropertyCard";
import LoadingSpinner from "../../../shared/LoadingSpinners/LoadingSpinner";
import API from "../../../api";
import { useCity } from "../../../contexts/CityContext";

import "./FeaturedProperties.css";

const AUTO_ROTATE_INTERVAL = 3000; // ms
const CARD_GAP = 48; // px

const FeaturedProperties = () => {
  const { city } = useCity();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const carouselRef = useRef(null);
  const timerRef = useRef(null);

  /* ---------------- PRICE FORMATTER ---------------- */
  const formatIndianPrice = useCallback((price) => {
    if (!price) return "Price on Request";
    if (price >= 1e7) return `${(price / 1e7).toFixed(2)} Cr`;
    if (price >= 1e5) return `${(price / 1e5).toFixed(2)} Lakh`;
    return `₹${price.toLocaleString("en-IN")}`;
  }, []);

  /* ---------------- DATA FETCH ---------------- */
  const {
    data: properties = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["featured-properties", city],
    queryFn: async () => {
      const res = await API.get(
        `/api/properties/featured?city=${city}`
      );
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  /* ---------------- CAROUSEL HELPERS ---------------- */
  const clampIndex = useCallback(
    (index) => Math.max(0, Math.min(index, properties.length - 1)),
    [properties.length]
  );

  const scrollToIndex = useCallback(
    (index) => {
      const container = carouselRef.current;
      if (!container || !container.firstChild) return;

      const cardWidth = container.firstChild.offsetWidth;
      const clamped = clampIndex(index);

      container.scrollTo({
        left: clamped * (cardWidth + CARD_GAP),
        behavior: "smooth",
      });

      setCurrentIndex(clamped);
    },
    [clampIndex]
  );

  const nextSlide = useCallback(() => {
    scrollToIndex(
      currentIndex + 1 >= properties.length ? 0 : currentIndex + 1
    );
  }, [currentIndex, properties.length, scrollToIndex]);

  const prevSlide = useCallback(() => {
    scrollToIndex(
      currentIndex - 1 < 0 ? properties.length - 1 : currentIndex - 1
    );
  }, [currentIndex, properties.length, scrollToIndex]);

  /* ---------------- AUTO ROTATE ---------------- */
  const startAutoRotate = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (properties.length <= 1) return;

    timerRef.current = setInterval(() => {
      if (!isPaused) nextSlide();
    }, AUTO_ROTATE_INTERVAL);
  }, [isPaused, nextSlide, properties.length]);

  useLayoutEffect(() => {
    if (properties.length > 0) {
      startAutoRotate();
    }
    return () => clearInterval(timerRef.current);
  }, [startAutoRotate, properties.length]);

  /* ---------------- UI STATES ---------------- */
  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  if (isError) {
    return (
      <section className="main-featured-properties-container error-container">
        <p>Failed to load featured properties.</p>
        <button className="retry-btn" onClick={refetch}>
          Retry
        </button>
      </section>
    );
  }

  if (properties.length === 0) {
    return (
      <section className="main-featured-properties-container no-properties">
        <p>No featured properties in {city}.</p>
        <Link
          to={`/properties?city=${encodeURIComponent(city)}`}
          className="browse-btn"
        >
          Browse Properties in {city}
        </Link>
      </section>
    );
  }

  /* ---------------- RENDER ---------------- */
  return (
    <section
      className="main-featured-properties-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <header className="featured-header">
        <h2 className="section-title-featured">
          <span className="highlight">Featured</span> Properties in {city}
        </h2>

        <Link
          to={`/properties?city=${encodeURIComponent(city)}`}
          className="view-projects-btn"
        >
          View More Projects
        </Link>
      </header>

      <div className="featured-properties-container">
        <div
          className="property-cards-containerrr"
          ref={carouselRef}
        >
          {properties.map((property) => (
            <FeaturedPropertyCard
              key={property._id}
              property={property}
              formatIndianPrice={formatIndianPrice}
            />
          ))}
        </div>

        <nav className="carousel-controls">
          <button
            className={`carousel-arrow left-arrow ${
              currentIndex === 0 ? "hidden-arrow" : ""
            }`}
            onClick={prevSlide}
            aria-label="Previous"
          >
            &lt;
          </button>

          <div className="featured-carousel-dots">
            {properties.map((_, index) => (
              <button
                key={index}
                className={`carousel-dot ${
                  index === currentIndex ? "active" : ""
                }`}
                onClick={() => scrollToIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <button
            className={`carousel-arrow right-arrow ${
              currentIndex === properties.length - 1
                ? "hidden-arrow"
                : ""
            }`}
            onClick={nextSlide}
            aria-label="Next"
          >
            &gt;
          </button>
        </nav>
      </div>
    </section>
  );
};

export default FeaturedProperties;
