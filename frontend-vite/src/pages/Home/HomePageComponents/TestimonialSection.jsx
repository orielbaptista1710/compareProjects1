import React, { useState, useCallback, useRef } from 'react';
import './TestimonialSection.css';

const TESTIMONIALS = [
  {
    id: 1,
    name: 'Karan M.',
    time: '1 week ago',
    text: 'My buying experience was exceptional — received with great hospitality. The riding performance is unlike anything I have tried before. Truly outstanding service from start to finish.',
    image: 'https://i.pravatar.cc/100?img=1',
    rating: 5,
  },
  {
    id: 2,
    name: 'Catherine L.',
    time: '10 days ago',
    text: 'I love my e-bike and the customer service is excellent. They respond promptly with loads of information about e-bikes, accessories, and maintenance.',
    image: 'https://i.pravatar.cc/100?img=5',
    rating: 5,
  },
  {
    id: 3,
    name: 'Peter R.',
    time: '2 weeks ago',
    text: 'Visited the EO store and the products are incredibly well-built. My wife and I took a test ride in the parking lot and were hooked. Bought with custom options — very satisfied.',
    image: 'https://i.pravatar.cc/100?img=12',
    rating: 5,
  },
  {
    id: 4,
    name: 'Sarah T.',
    time: '3 days ago',
    text: 'Exceptional service and quality products. The team was incredibly helpful throughout the entire process, from first inquiry to delivery.',
    image: 'https://i.pravatar.cc/100?img=9',
    rating: 5,
  },
  {
    id: 5,
    name: 'Michael D.',
    time: '5 days ago',
    text: 'Great experience from start to finish. The attention to detail and after-sales support really sets this apart. Would absolutely recommend to anyone.',
    image: 'https://i.pravatar.cc/100?img=15',
    rating: 5,
  },
];

const StarRating = ({ rating }) => (
  <div className="ts-stars" aria-label={`Rated ${rating} out of 5 stars`}>
    {Array.from({ length: 5 }).map((_, i) => (
      <svg
        key={i}
        className={`ts-star ${i < rating ? 'ts-star--filled' : 'ts-star--empty'}`}
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

const TestimonialCard = ({ testimonial, isActive }) => (
  <article
    className={`ts-card ${isActive ? 'ts-card--active' : ''}`}
    aria-label={`Testimonial from ${testimonial.name}`}
  >
    <blockquote className="ts-card__quote">
      <p>"{testimonial.text}"</p>
    </blockquote>
    <StarRating rating={testimonial.rating} />
    <footer className="ts-card__user">
      <img
        src={testimonial.image}
        alt={`${testimonial.name}`}
        className="ts-card__avatar"
        loading="lazy"
        width={44}
        height={44}
      />
      <div className="ts-card__user-info">
        <strong>{testimonial.name}</strong>
        <span className="ts-card__time">{testimonial.time}</span>
      </div>
    </footer>
  </article>
);

const TestimonialSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const trackRef = useRef(null);
  const total = TESTIMONIALS.length;

  const goTo = useCallback((index) => {
    const bounded = ((index % total) + total) % total;
    setCurrentIndex(bounded);
    if (trackRef.current) {
      const card = trackRef.current.children[bounded];
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [total]);

  const next = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
  const prev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);


  return (
    <section
      className="ts-section"
      aria-labelledby="ts-heading"
    >

      <div className="ts-container">
        {/* ── Left column ── */}
        <div className="ts-sidebar">
          <div className="ts-eyebrow">Customer Reviews</div>
          <h2 id="ts-heading" className="ts-heading">
            Read reviews,<br />
            <span className="ts-heading__accent">invest with confidence.</span>
          </h2>

          {/* Rating badge */}
          <div className="ts-badge">
            <div className="ts-badge__score">
              <span className="ts-badge__number">4.2</span>
              <span className="ts-badge__denom">/5</span>
            </div>
            <div className="ts-badge__divider" />
            <div className="ts-badge__meta">
              <StarRating rating={4} />
              <span className="ts-badge__count">Based on 5,210 reviews</span>
            </div>
          </div>

          {/* Nav controls */}
          <div className="ts-nav">
            <button
              className="ts-nav__btn"
              onClick={prev}
              aria-label="Previous testimonial"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </button>
            <div className="ts-nav__dots" role="tablist" aria-label="Testimonial navigation">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={i === currentIndex}
                  aria-label={`Go to testimonial ${i + 1}`}
                  className={`ts-nav__dot ${i === currentIndex ? 'ts-nav__dot--active' : ''}`}
                  onClick={() => goTo(i)}
                />
              ))}
            </div>
            <button
              className="ts-nav__btn"
              onClick={next}
              aria-label="Next testimonial"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Right column — cards ── */}
        <div className="ts-carousel-wrapper">
          <div
            className="ts-track"
            ref={trackRef}
            role="region"
            aria-label="Testimonials carousel"
            aria-live="polite"
          >
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard
                key={t.id}
                testimonial={t}
                isActive={i === currentIndex}
              />
            ))}
          </div>

          {/* Fade edges */}
          <div className="ts-fade ts-fade--left" aria-hidden="true" />
          <div className="ts-fade ts-fade--right" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
};

export default React.memo(TestimonialSection);