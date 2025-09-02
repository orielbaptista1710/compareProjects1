import React from "react";
import Slider from "react-slick";
import "./RelatedArticles.css"; // for styling

const RelatedArticles = ({ articles = [] }) => {
  if (!articles || articles.length === 0) {
    return <p className="no-articles">No related articles found.</p>;
  }

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1, // one at a time in vertical carousel
    slidesToScroll: 1,
    vertical: true,
    verticalSwiping: true,
    autoplay: true,
    autoplaySpeed: 3000,
  };

  return (
    <div className="related-articles">
      <h2 className="related-title">Related Articles</h2>
      <Slider {...settings}>
        {articles.map((article, index) => (
          <div key={index} className="article-card">
            <img src={article.image} alt={article.title} />
            <h3>{article.title}</h3>
            <p>{article.excerpt}</p>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default RelatedArticles;
