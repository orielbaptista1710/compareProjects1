// src/components/Gallery.js
import React from 'react';
import './Gallery.css'; // Assuming you have your CSS file
import galleryimg1 from '../images/image1.jpg'
import galleryimg2 from '../images/image2.jpg'
import galleryimg3 from '../images/image3.jpg'

const Gallery = () => {
  return (
    <section className="gallery-container">
      <div className="container">
        <div className="main-wrapper">
          <div className="main-gallery">
            <img alt="gallery" className="gallery-image" src={galleryimg1} />
            <div className="gallery-content">
              <h2>Mumbai</h2>
              <p>Skateboard +1 mustache fixie paleo lumbersexual.</p>
              <a className="learn-more">
                Learn More
                <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="arrow-icon" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7"></path>
                </svg>
              </a>
            </div>
          </div>

          <div className="sub-gallery-wrapper">
            <div className="sub-gallery">
              <img alt="gallery" className="gallery-image" src={galleryimg2} />
              <div className="gallery-content">
                <h2>Bandra</h2>
                <p>Skateboard +1 mustache fixie paleo lumbersexual.</p>
                <a className="learn-more">
                  Learn More
                  <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="arrow-icon" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7"></path>
                  </svg>
                </a>
              </div>
            </div>

            <div className="sub-gallery">
              <img alt="gallery" className="gallery-image" src={galleryimg3} />
              <div className="gallery-content">
                <h2>Vasai</h2>
                <p>Skateboard +1 mustache fixie paleo lumbersexual.</p>
                <a className="learn-more">
                  Learn More
                  <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="arrow-icon" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7"></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Gallery;
