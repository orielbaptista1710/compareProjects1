import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './FeaturedProperties.css';

const FeaturedProperties = () => {
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchFeaturedProperties = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/properties/featured');
        setFeaturedProperties(response.data);
      } catch (error) {
        console.error('Error fetching featured properties:', error);
      }
    };

    fetchFeaturedProperties();
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === featuredProperties.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? featuredProperties.length - 1 : prevIndex - 1
    );
  };

  return (
    <section className="featured-properties">
      <div className="section-header">
        <h2>Featured Projects</h2>
        <Link to="/properties" className="see-all-link">See all Projects →</Link>
      </div>

      <div className="carousel-container">
        <button className="carousel-button prev" onClick={prevSlide}>&lt;</button>
        
        <div className="carousel-track">
          {featuredProperties.map((property, index) => (
            <div 
              key={property._id}
              className={`property-card ${index === currentIndex ? 'active' : ''}`}
            >
              <div className="property-image">
                <img src={property.coverimage} alt={property.title} />
              </div>
              <div className="property-details">
                <h3>{property.title}</h3>
                <p className="developer">by {property.developers || 'Goyal & Co and Hariyana Group'}</p>
                <p className="location">{property.locality}, {property.city}</p>
                <p className="marketed-by">Marketed by {property.marketedBy || 'Goyal & Co and Hariyana Group'}</p>
                
                <div className="property-specs">
                  <span className="bhk">{property.bhk || '2, 3 BHK Flats'}</span>
                  <span className="price">₹ {property.price ? (property.price / 10000000).toFixed(2) + ' Cr' : '1.40 Cr'} onwards</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="carousel-button next" onClick={nextSlide}>&gt;</button>
      </div>

      <div className="carousel-dots">
        {featuredProperties.map((_, index) => (
          <button
            key={index}
            className={`dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </section>
  );
};

export default FeaturedProperties;