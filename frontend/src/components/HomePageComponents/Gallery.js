import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import './Gallery.css';
import galleryimg1 from '../../images/image1.jpg';
import galleryimg2 from '../../images/image2.jpg';
import galleryimg3 from '../../images/image3.jpg';

const Gallery = () => {
  const navigate = useNavigate();

  const handleExploreCity = (city, localities = []) => {
    // Create URL parameters for filtering
    const params = new URLSearchParams();
    params.append('city', city);
    
    // Add localities if provided
    if (localities.length > 0) {
      localities.forEach(locality => {
        params.append('locality', locality);
      });
    }
    
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <section className="compact-gallery">
      <div className="gallery-container">
        {/* Main Featured Card - Mumbai */}
        <div className="featured-card" onClick={() => handleExploreCity('Mumbai')}>
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
                className="Gallery-explore-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleExploreCity('Mumbai');
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
          {/* Bandra (Mumbai locality) */}
          <div className="secondary-card" onClick={() => handleExploreCity('Mumbai', ['Bandra West'])}>
            <img 
              alt="Luxury properties in Bandra" 
              className="secondary-image" 
              src={galleryimg2} 
              loading="lazy"
            />
            <div className="card-overlay">
              <div className="card-content">
                <h2>Bandra</h2>
                <p>Premium properties in Mumbai's most sought-after locality</p>
                <button 
                  className="Gallery-explore-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExploreCity('Mumbai', ['Bandra West']);
                  }}
                  aria-label={`View properties in Bandra`}
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

          {/* Vasai (Mumbai locality) */}
          <div className="secondary-card" onClick={() => handleExploreCity('Mumbai', ['Vasai'])}>
            <img 
              alt="Affordable properties in Vasai" 
              className="secondary-image" 
              src={galleryimg3} 
              loading="lazy"
            />
            <div className="card-overlay">
              <div className="card-content">
                <h2>Vasai</h2>
                <p>Budget-friendly options in Mumbai's suburban area</p>
                <button 
                  className="Gallery-explore-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExploreCity('Mumbai', ['Vasai']);
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

export default memo(Gallery);