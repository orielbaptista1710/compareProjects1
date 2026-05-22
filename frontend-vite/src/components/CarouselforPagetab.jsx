// Carousel.js
import React, { useState } from 'react';
import './CarouselforPagetab.css';

const Carousel = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  return (
    <div className="carousel">
      <button className="carousel-btn prev" onClick={prevSlide}>&#10094;</button>
      <img src={images[currentIndex]} alt={`Slide ${currentIndex}`} className="carousel-image" loading="lazy"/>
      <button className="carousel-btn next" onClick={nextSlide}>&#10095;</button>
      <div className="carousel-dots">
        {images.map((_, idx) => (
          <span
            key={idx}
            className={`dot ${currentIndex === idx ? 'active' : ''}`}
            onClick={() => setCurrentIndex(idx)}
          ></span>
        ))}
      </div>
    </div>
  );
};

export default Carousel;
