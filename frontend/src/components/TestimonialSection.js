import React, { useState, useCallback, useRef, useEffect } from 'react';
import './TestimonialSection.css';

const TestimonialSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const testimonialsRef = useRef(null);
  
  const testimonials = [
    {
      id: 1,
      name: 'Karan',
      time: '1 week ago',
      text: 'My buying experience is so nice, and received me very politely. Riding experience is also very good. Very good performance. I never experienced such a kind of performance. Very good service.',
      image: 'https://i.pravatar.cc/100?img=1',
      rating: 5,
    },
    {
      id: 2,
      name: 'Catherine',
      time: '10 days ago',
      text: 'I love my e-bike and the customer service is excellent. They respond in a timely manner with loads of information about e-bikes, accessories and maintenance information.',
      image: 'https://i.pravatar.cc/100?img=2',
      rating: 5,
    },
    {
      id: 3,
      name: 'Peter',
      time: '2 weeks ago',
      text: 'Visited to EO store. Product particularly welds, looked my wife and I took small test in parking lot area. We bought with customization after went over all the options. Very satisfied.',
      image: 'https://i.pravatar.cc/100?img=3',
      rating: 5,
    },
    {
      id: 4,
      name: 'Sarah',
      time: '3 days ago',
      text: 'Exceptional service and quality products. The team was very helpful throughout the entire process.',
      image: 'https://i.pravatar.cc/100?img=4',
      rating: 5,
    },
    {
      id: 5,
      name: 'Michael',
      time: '5 days ago',
      text: 'Great experience from start to finish. Would definitely recommend to others looking for quality service.',
      image: 'https://i.pravatar.cc/100?img=5',
      rating: 5,
    },
  ];

  const scrollToTestimonial = useCallback((index) => {
    if (testimonialsRef.current) {
      const cardWidth = testimonialsRef.current.children[0].offsetWidth + 30; // width + gap
      testimonialsRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth'
      });
      setCurrentIndex(index);
    }
  }, []);

  const nextTestimonial = useCallback(() => {
    const nextIndex = (currentIndex + 1) % testimonials.length;
    scrollToTestimonial(nextIndex);
  }, [currentIndex, testimonials.length, scrollToTestimonial]);

  const prevTestimonial = useCallback(() => {
    const prevIndex = (currentIndex - 1 + testimonials.length) % testimonials.length;
    scrollToTestimonial(prevIndex);
  }, [currentIndex, testimonials.length, scrollToTestimonial]);

  // Auto-scroll functionality
  useEffect(() => {
    const interval = setInterval(() => {
      nextTestimonial();
    }, 5000);

    return () => clearInterval(interval);
  }, [nextTestimonial]);

  return (
    <section className="testimonial-section" aria-labelledby="testimonial-heading">
      <div className="testimonial-container">
        <h2 id="testimonial-heading">
          Read reviews,<br />
          <span>invest with confidence.</span>
        </h2>
        
        <div className="trustpilot-info">
          <span className="rating">4.2/5</span>
          <span className="trustpilot">CompareProject</span>
          <span className="reviews">Based on 5210 reviews</span>
        </div>

        <div className="testimonial-content-wrapper">
          <div className="testimonial-header">
            <div className="quote-icon" aria-hidden="true">"</div>
            <h3>What our users are saying</h3>
            <div className="slider-nav">
              <button 
                className="arrow" 
                onClick={prevTestimonial}
                aria-label="Previous testimonial"
              >
                &#8592;
              </button>
              <span className="line" aria-hidden="true"></span>
              <button 
                className="arrow" 
                onClick={nextTestimonial}
                aria-label="Next testimonial"
              >
                &#8594;
              </button>
            </div>
          </div>

          <div 
            className="testimonials" 
            ref={testimonialsRef}
            role="region"
            aria-label="Testimonials carousel"
          >
            {testimonials.map((testimonial) => (
              <div 
                className="testimonial-card" 
                key={testimonial.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`Testimonial from ${testimonial.name}`}
              >
                <p>"{testimonial.text}"</p>
                <div 
                  className="stars" 
                  aria-label={`Rated ${testimonial.rating} out of 5 stars`}
                >
                  {'★'.repeat(testimonial.rating)}
                </div>
                <div className="user">
                  <img 
                    src={testimonial.image} 
                    alt={`${testimonial.name}'s avatar`} 
                    className="user-avatar" 
                    loading="lazy"
                    width={48}
                    height={48}
                  />
                  <div className="user-info">
                    <strong>{testimonial.name}</strong>
                    <div className="time">{testimonial.time}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default React.memo(TestimonialSection);