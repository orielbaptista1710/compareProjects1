import React from 'react';
import './TestimonialSection.css';


const testimonials = [
  {
    name: 'Karan',
    time: '1 week ago',
    text: 'My buying experience is so nice, and received me very politely. Riding experience is also very good. Very good performance. I never experienced such a kind of performance. Very good service.',
    image: 'https://i.pravatar.cc/100?img=1',
    rating: 5,
  },
  {
    name: 'Catherine',
    time: '10 days ago',
    text: 'I love my e-bike and the customer service is excellent. They respond in a timely manner with loads of information about e-bikes, accessories and maintenance information.',
    image: 'https://i.pravatar.cc/100?img=2',
    rating: 5,
  },
  {
    name: 'Peter',
    time: '2 weeks ago',
    text: 'Visited to EO store. Product particularly welds, looked my wife and I took small test in parking lot area. We bought with customization after went over all the options. Very satisfied.',
    image: 'https://i.pravatar.cc/100?img=3',
    rating: 5,
  },
];

const TestimonialSection = () => {
  return (
    <section className="testimonial-section">
      <div className="testimonial-container">
        <h2>Read reviews,<br /><span>invest with confidence.</span></h2>
        <div className="trustpilot-info">
  <span className="rating">4.2/5</span>
  <span className="trustpilot">
    CompareProject
  </span>
  <span className="reviews">Based on 5210 reviews</span>
</div>

        <div className="testimonial-content-wrapper">
          <div className="testimonial-header">
            <div className="quote-icon">“</div>
            <h3>What our users are saying</h3>
            <div className="slider-nav">
              <span className="arrow">&#8592;</span>
              <span className="line"></span>
              <span className="arrow">&#8594;</span>
            </div>
          </div>

          <div className="testimonials">
            {testimonials.map((t, i) => (
              <div className="testimonial-card" key={i}>
                <p>{t.text}</p>
                <div className="stars">{'★'.repeat(t.rating)}</div>
                <div className="user">
                  <img src={t.image} alt={t.name} className="user-avatar" loading="lazy"/>
                  <div className="user-info">
                    <strong>{t.name}</strong>
                    <div className="time">{t.time}</div>
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

export default TestimonialSection;