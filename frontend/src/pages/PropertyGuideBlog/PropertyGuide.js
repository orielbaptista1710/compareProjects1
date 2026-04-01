import React from "react";
import { useEffect, useState } from "react";
import API from "../../api";

import { fallbackImg } from "../../utils/propertyHelpers";

import { CalendarDays, ArrowRight, ExternalLink } from "lucide-react";
import Seo from "../../database/Seo";
import BuyingGuide from "../PropertyGuideBlog/BuyingGuide"
import "./PropertyGuide.css";


// ─── PropertyGuide ────────────────────────────────────────────────────────────
const PropertyGuide = () => {
  const [articles, setArticles] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [sideArticles, setSideArticles] = useState([]);


  const tools = [
    {
      title: "First-Time Buyer Checklist",
      description:
        "A handy checklist to make sure you don't miss any step while purchasing your first property.",
      file: "/files/first-time-buyer-checklist.pdf",
    },
    {
      title: "Home Loan EMI Calculator",
      description:
        "Plan your budget with our EMI calculator and compare different financing options.",
      file: "/tools/emi-calculator",
    },
    {
      title: "Legal Document Verification Guide",
      description:
        "Understand which legal documents to verify before signing a deal.",
      file: "/files/legal-document-guide.pdf",
    },
  ];

  const YOUTUBE_EMBED = {
    videoId: "8yG32yU15gA",
    title: "How to Buy Property in India — A Complete Guide",
  };

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await API.get("/api/news/real-estate");
        const data = res.data || [];
        setFeatured(data[0] || null);
        setSideArticles(data.slice(1, 4));
        setArticles(data.slice(4, 10));
      } catch (error) {
        console.error("Failed to fetch news", error);
      }
    };
    fetchNews();
  }, []);

  return (
    <div className="property-guide">
      <Seo
        title="Property Guide India | Buy, Sell & Invest Smartly"
        description="Latest real estate news, buying guides, EMI tools, and legal checklists for property buyers in India."
      />

      <div className="header-spacer"></div>

      <div className="hero-section"> 
        <div className="container">
          <div className="hero-grid">
            {featured && (
              <div className="featured-article">
                <img src={featured.image || fallbackImg} alt={featured.title} loading="lazy" />
                <div className="featured-overlay">
                  <h1>{featured.title}</h1>
                  <div className="article-date">
                    <CalendarDays size={16} strokeWidth={1.5} />
                    <span>{new Date(featured.date).toDateString()}</span>
                  </div>
                  <p>{featured.description}</p>
                  <a href={featured.url} target="_blank" rel="noopener noreferrer" className="read-more">
                    Read More <ArrowRight size={16} strokeWidth={1.5} />
                  </a>
                </div>
              </div>
            )}

            <div className="side-articles">
              {sideArticles.map((article, idx) => (
                <div key={idx} className="side-article-card">
                  <img src={article.image || fallbackImg} alt={article.title} loading="lazy" />
                  <div className="side-article-content">
                    <h3>{article.title}</h3>
                    <div className="article-date">
                      <CalendarDays size={16} strokeWidth={1.5} />
                      <span>{new Date(article.date).toDateString()}</span>
                    </div>
                    <a href={article.url} target="_blank" rel="noopener noreferrer" className="read-more">
                      Read More <ArrowRight size={16} strokeWidth={1.5} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="latest-section">
        <div className="container">
          <div className="guide-section-header">
            <div>
              <h2>
                Explore the Latest{" "}
                <span className="underline-text">News in Real-Estate</span>
              </h2>
              <p className="section-description">
                Lorem ipsum dolor sit amet, consectetur turpis eget ipsum using
                ulpa quam elit tarius tellus nisi sunt amet sit maximus elit
                mattis in tellus lacus.
              </p>
            </div>
          </div>

          <div className="articles-grid">
            {articles.map((article, idx) => (
              <div key={idx} className="article-card">
                <div className="article-image">
                  <img src={article.image || fallbackImg} alt={article.title} loading="lazy" />
                </div>
                <div className="article-content">
                  <h3>{article.title}</h3>
                  <div className="article-date">
                    <CalendarDays size={16} strokeWidth={1.5} />
                    <span>{article.date}</span>
                  </div>
                  <a href={article.url} className="read-more" target="_blank" rel="noopener noreferrer">
                    Read More <ArrowRight size={16} strokeWidth={1.5} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Buying Guide Section */}
      <BuyingGuide />

      {/* Tools & Checklists Section */}
      <div className="tools-section">
        <div className="container">
          <div className="guide-section-header">
            <h2>
              Helpful <span className="underline-text">Checklists & Tools</span>
            </h2>
            <p className="section-description">
              Download practical resources and use our tools to make informed
              property decisions with ease.
            </p>
          </div>

          <div className="tools-grid">
            {tools.map((tool, idx) => (
              <div key={idx} className="tool-card">
                <h3>{tool.title}</h3>
                <p>{tool.description}</p>
                <a
                  href={tool.file}
                  className="download-btn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {tool.file.endsWith(".pdf") ? "Download PDF" : "Use Tool"}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyGuide;