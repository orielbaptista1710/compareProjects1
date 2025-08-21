import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Gallery.css';
import galleryimg1 from '../images/image1.jpg';
import galleryimg2 from '../images/image2.jpg';
import galleryimg3 from '../images/image3.jpg';

const Gallery = () => {
  const navigate = useNavigate();

  const handleLearnMore = (location) => {
    navigate(`/properties?city=${encodeURIComponent(location)}`);
  };

  return (
    <section className="compact-gallery">
      <div className="gallery-container">
        {/* Main Featured Card */}
        <div className="featured-card" onClick={() => handleLearnMore('Mumbai')}>
          <img 
            alt="Modern apartment in Mumbai" 
            className="featured-image" 
            src={galleryimg1} 
            loading="lazy" 
          />
          <div className="card-overlay">
            <div className="card-content">
              <h2>Mumbai</h2>
              <p>Discover luxury properties in India's financial capital</p>
              <button 
                className="explore-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLearnMore('Mumbai');
                }}
                aria-label={`View properties in Mumbai`}
              >
                Explore
                <svg 
                  fill="none" 
                  stroke="currentColor" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  className="btn-arrow" 
                  viewBox="0 0 24 24"
                >
                  <path d="M5 12h14M12 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Cards */}
        <div className="secondary-cards">
          <div className="secondary-card" onClick={() => handleLearnMore('Goa')}>
            <img 
              alt="Luxury villa in Goa" 
              className="secondary-image" 
              src={galleryimg2} 
              loading="lazy"
            />
            <div className="card-overlay">
              <div className="card-content">
                <h2>Goa</h2>
                <p>Beachfront villas and vacation homes</p>
                <button 
                  className="explore-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLearnMore('Goa');
                  }}
                  aria-label={`View properties in Goa`}
                >
                  Explore
                  <svg 
                    fill="none" 
                    stroke="currentColor" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    className="btn-arrow" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="secondary-card" onClick={() => handleLearnMore('Vasai')}>
            <img 
              alt="Beach house in Vasai" 
              className="secondary-image" 
              src={galleryimg3} 
              loading="lazy"
            />
            <div className="card-overlay">
              <div className="card-content">
                <h2>Vasai</h2>
                <p>Serene suburban retreats near Mumbai</p>
                <button 
                  className="explore-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLearnMore('Vasai');
                  }}
                  aria-label={`View properties in Vasai`}
                >
                  Explore
                  <svg 
                    fill="none" 
                    stroke="currentColor" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    className="btn-arrow" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Gallery;