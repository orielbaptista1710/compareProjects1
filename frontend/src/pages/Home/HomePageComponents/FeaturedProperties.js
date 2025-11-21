import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
// import axios from 'axios';
import FeaturedPropertyCard from './FeaturedPropertyCard';
import './FeaturedProperties.css';
import LoadingSpinner from '../LoadingSpinner';
import API from "../../api";
 
const AUTO_ROTATE_INTERVAL = 3000; // ms
const CARD_GAP = 48; // px

const FeaturedProperties = () => {
  const [properties, setProperties] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  const carouselRef = useRef(null);
  const timerRef = useRef(null);

  const formatIndianPrice = useCallback((price) => {
    if (!price) return 'Price on Request';
    if (price >= 1e7) return `${(price / 1e7).toFixed(2)} Cr`;
    if (price >= 1e5) return `${(price / 1e5).toFixed(2)} Lakh`;
    return `₹${price.toLocaleString('en-IN')}`;
  }, []);

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
        behavior: 'smooth',
      });

      setCurrentIndex(clamped);
    },
    [clampIndex]
  );

  const nextSlide = useCallback(() => scrollToIndex(currentIndex + 1 >= properties.length ? 0 : currentIndex + 1), [
    currentIndex,
    properties.length,
    scrollToIndex,
  ]);

  const prevSlide = useCallback(() => scrollToIndex(currentIndex - 1 < 0 ? properties.length - 1 : currentIndex - 1), [
    currentIndex,
    properties.length,
    scrollToIndex,
  ]);

  const fetchProperties = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await API.get("/api/properties/featured");
      setProperties(res.data);
    } catch {
      setError('Failed to load featured properties. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const startAutoRotate = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (properties.length <= 1) return;

    timerRef.current = setInterval(() => {
      if (!isPaused) nextSlide();
    }, AUTO_ROTATE_INTERVAL);
  }, [isPaused, nextSlide, properties.length]);

  useEffect(() => {
    fetchProperties();
  }, []);

  useLayoutEffect(() => {
    startAutoRotate();
    return () => clearInterval(timerRef.current);
  }, [startAutoRotate]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  if (isLoading) {
    return (
      <LoadingSpinner size="lg" />
    );
  }

  if (error) {
    return (
      <section className="main-featured-properties-container error-container">
        <p>{error}</p>
        <button className="retry-btn" onClick={fetchProperties}>Retry</button>
      </section>
    );
  }

  if (properties.length === 0) {
    return (
      <section className="main-featured-properties-container no-properties">
        <p>No featured properties available at the moment.</p>
        <Link to="/properties" className="browse-btn">Browse All Properties</Link>
      </section>
    );
  }

  return (
    <section
      className="main-featured-properties-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <header className="featured-header">
        <h2 className="section-title-featured">
          <span className="highlight">Featured</span> Properties
        </h2>
        <Link to="/properties" className="view-projects-btn">
          View More Projects
        </Link>
      </header>

      <div className="featured-properties-container">
        <div className="property-cards-containerrr" ref={carouselRef}>
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
            className={`carousel-arrow left-arrow ${currentIndex === 0 ? 'hidden-arrow' : ''}`}
            onClick={prevSlide}
            aria-label="Previous"
          >
            &lt;
          </button>

          <div className="featured-carousel-dots">
            {properties.map((_, index) => (
              <button
                key={index}
                className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => scrollToIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <button
            className={`carousel-arrow right-arrow ${currentIndex === properties.length - 1 ? 'hidden-arrow' : ''}`}
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
