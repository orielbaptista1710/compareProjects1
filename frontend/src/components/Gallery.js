import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Gallery.css';
import galleryimg1 from '../images/image1.jpg';
import galleryimg2 from '../images/image2.jpg';
import galleryimg3 from '../images/image3.jpg';

const Gallery = () => {
  const navigate = useNavigate();

  const handleLearnMore = (location) => {
    // Navigate to properties page with location filter
    navigate(`/properties?city=${encodeURIComponent(location)}`);
  };

  return (
    <section className="gallery-container">
      <div className="container">
        <div className="main-wrapper">
          <div className="main-gallery">
            <img alt="Modern apartment in Mumbai" className="gallery-image" src={galleryimg1} />
            <div className="gallery-content">
              <h2>Mumbai</h2>
              <p>Skateboard +1 mustache fixie paleo lumbersexual.</p>
              <button 
                className="learn-more"
                onClick={() => handleLearnMore('Mumbai')}
                aria-label={`View properties in Mumbai`}
              >
                Learn More
                <svg 
                  fill="none" 
                  stroke="currentColor" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  className="arrow-icon" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M12 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>

          <div className="sub-gallery-wrapper">
            <div className="sub-gallery">
              <img alt="Luxury villa in Bandra" className="gallery-image" src={galleryimg2} />
              <div className="gallery-content">
                <h2>Bandra</h2>
                <p>Skateboard +1 mustache fixie paleo lumbersexual.</p>
                <button 
                  className="learn-more"
                  onClick={() => handleLearnMore('Bandra')}
                  aria-label={`View properties in Bandra`}
                >
                  Learn More
                  <svg 
                    fill="none" 
                    stroke="currentColor" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    className="arrow-icon" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7"></path>
                  </svg>
                </button>
              </div>
            </div>

            <div className="sub-gallery">
              <img alt="Beach house in Vasai" className="gallery-image" src={galleryimg3} />
              <div className="gallery-content">
                <h2>Vasai</h2>
                <p>Skateboard +1 mustache fixie paleo lumbersexual.</p>
                <button 
                  className="learn-more"
                  onClick={() => handleLearnMore('Vasai')}
                  aria-label={`View properties in Vasai`}
                >
                  Learn More
                  <svg 
                    fill="none" 
                    stroke="currentColor" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    className="arrow-icon" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
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