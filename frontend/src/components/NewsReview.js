// NewsReview.jsx
import React, { useState, useEffect } from 'react';
import './NewsReview.css';

const NewsReview = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const newsItems = [
    {
      id: 1,
      title: "Group Satellite launches Aarambh Avyaan in Malad East",
      summary: "According to the company, a 250 sqft 1 BHK is available from Rs 50 Lakh all-inclusive.",
      author: "Anuradha Ramamirtham",
      date: "Mar 2024",
      category: "Real Estate",
      readTime: "2 min read",
      image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80"
    },
    {
      id: 2,
      title: "K Raheja Realty launches new residential tower at Raheja...",
      summary: "The 20-storey tower comprises 2 BHK units starting from Rs 1.95 crore.",
      author: "Housing News Desk",
      date: "Mar 2023",
      category: "Development",
      readTime: "3 min read",
      image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80"
    },
    {
      id: 3,
      title: "Mumbalternativt - New Urban Planning Initiative",
      summary: "While Phase 1 and work on F Road is expected to complete by Q4 2024...",
      author: "Anuradha Rana",
      date: "Feb 2024",
      category: "Urban Planning",
      readTime: "4 min read",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80"
    },
    {
      id: 4,
      title: "Affordable Housing Scheme Receives Government Approval",
      summary: "New policy aims to provide housing for low-income families in metro cities.",
      author: "Policy Watch",
      date: "Jan 2024",
      category: "Policy",
      readTime: "5 min read",
      image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200&q=80"
    }
  ];

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % newsItems.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoPlay, newsItems.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % newsItems.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + newsItems.length) % newsItems.length);
  };

  // const goToSlide = (index) => {
  //   setCurrentSlide(index);
  // };

  const handleArticleClick = (id) => {
    // In production, this would navigate to the full article
    console.log(`Navigating to article ${id}`);
    // Example: navigate(`/news/${id}`);
  };

  return (
    <div className="news-review">
      <div className="news-header">
        <h2 className="news-section-title">News & Articles</h2>
        <div className="controls">
          <button 
            className="control-btn prev" 
            onClick={prevSlide}
            aria-label="Previous article"
          >
            ‹
          </button>
          <button 
            className="control-btn next" 
            onClick={nextSlide}
            aria-label="Next article"
          >
            ›
          </button>
          <button 
            className={`auto-play-btn ${autoPlay ? 'active' : ''}`}
            onClick={() => setAutoPlay(!autoPlay)}
            aria-label={autoPlay ? 'Pause auto-play' : 'Start auto-play'}
          >
            {autoPlay ? '❚❚' : '▶'}
          </button>
        </div>
      </div>

      <div className="news-carousel">
        <div 
          className="slides-container"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {newsItems.map((item) => (
            <div 
              key={item.id} 
              className="news-slide"
              onClick={() => handleArticleClick(item.id)}
            >
              <div className="slide-content">
                <div className="image-container">
                  <img src={item.image} alt={item.title} />
                  <span className="category-tag">{item.category}</span>
                </div>
                <div className="text-content">
                  <h3 className="news-title">{item.title}</h3>
                  <p className="news-summary">{item.summary}</p>
                  <div className="news-meta">
                    <span className="news-author">{item.author}</span>
                    <span className="news-date">{item.date}</span>
                    <span className="read-time">{item.readTime}</span>
                  </div>
                  <button className="read-more-btn">Read Full Article</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default NewsReview;