import React from "react";
import { CalendarDays, ArrowRight } from "lucide-react";
import Seo from "../../database/Seo";
import "./PropertyGuide.css";

const PropertyGuide = () => {
  const featuredArticle = {
    title: "Exploring Future Renewable Energy Innovations",
    date: "December 11, 2023",
    description:
      "Join us on a journey where we delve into the realms of innovation, share insights, and explore the transformative power of technology. Our...",
    image:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
  };

  const sideArticles = [
    {
      title: "From Ideas to Impact in a Startup's Journey",
      date: "November 20, 2023",
      image:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80",
    },
    {
      title: "Navigating the Tech Landscape with Insights",
      date: "November 20, 2023",
      image:
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80",
    },
    {
      title: "Behind the Scenes of Crafting Our Startup",
      date: "November 20, 2023",
      image:
        "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&q=80",
    },
  ];

  const articles = [
    {
      title: "Empowering Entrepreneurs Success Unveiled",
      date: "December 8, 2023",
      image:
        "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&q=80",
    },
    {
      title: "Thriving in a Dynamic Startup Landscape",
      date: "December 8, 2023",
      image:
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80",
    },
    {
      title: "Strategies Propelling Tech Startups to Success",
      date: "December 8, 2023",
      image:
        "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&q=80",
    },
    {
      title: "Pioneering the Future in Our Startup Showcase",
      date: "December 8, 2023",
      image:
        "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&q=80",
    },
    {
      title: "Artificial Intelligence Impact on Modern Industries",
      date: "December 17, 2023",
      image:
        "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&q=80",
    },
    {
      title: "Healthy Eating Habits for a Busy Lifestyle",
      date: "December 11, 2023",
      image:
        "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80",
    },
  ];

  const buyingGuideSteps = [
    {
      step: "Step 1",
      title: "Set Your Budget",
      description:
        "Know how much you can afford before starting your property search.",
    },
    {
      step: "Step 2",
      title: "Research Localities",
      description:
        "Check connectivity, safety, and growth potential of neighborhoods.",
    },
    {
      step: "Step 3",
      title: "Evaluate Builders",
      description:
        "Look into the builder’s reputation, past projects, and delivery track record.",
    },
    {
      step: "Step 4",
      title: "Check Legal Documents",
      description: "Verify title deeds, approvals, and RERA registration.",
    },
    {
      step: "Step 5",
      title: "Financing & Loans",
      description:
        "Compare bank loan offers, interest rates, and EMI flexibility.",
    },
    {
      step: "Step 6",
      title: "Registration & Handover",
      description:
        "Complete stamp duty, registration, and property possession formalities.",
    },
  ];

  const tools = [
    {
      title: "First-Time Buyer Checklist",
      description:
        "A handy checklist to make sure you don’t miss any step while purchasing your first property.",
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

  return (
    <div className="property-guide">
      <Seo
        title="Property Guide | CompareProjects"
        description="Learn everything about buying, selling, and investing in properties in India. Tips, insights, and guides to help you make smart property decisions."
      />

      <div className="header-spacer"></div>

      <div className="hero-section">
        <div className="container">
          <div className="hero-grid">
            <div className="featured-article">
              <img
                src={featuredArticle.image}
                alt={featuredArticle.title}
              />
              <div className="featured-overlay">
                <h1>{featuredArticle.title}</h1>
                <div className="article-date">
                  <CalendarDays size={16} strokeWidth={1.5} />
                  <span>{featuredArticle.date}</span>
                </div>
                <p>{featuredArticle.description}</p>
                <a href="#" className="read-more">
                  Read More <ArrowRight size={16} strokeWidth={1.5} />
                </a>
              </div>
            </div>

            <div className="side-articles">
              {sideArticles.map((article, idx) => (
                <div key={idx} className="side-article-card">
                  <img src={article.image} alt={article.title} />
                  <div className="side-article-content">
                    <h3>{article.title}</h3>
                    <div className="article-date">
                      <CalendarDays size={16} strokeWidth={1.5} />
                      <span>{article.date}</span>
                    </div>
                    <a href="#" className="read-more">
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
                Explore Our Latest{" "}
                <span className="underline-text">Articles</span>
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
                  <img src={article.image} alt={article.title} />
                </div>
                <div className="article-content">
                  <h3>{article.title}</h3>
                  <div className="article-date">
                    <CalendarDays size={16} strokeWidth={1.5} />
                    <span>{article.date}</span>
                  </div>
                  <a href="#" className="read-more">
                    Read More <ArrowRight size={16} strokeWidth={1.5} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Buying Guide Section */}
      <div className="buying-guide-section">
        <div className="container">
          <div className="guide-section-header">
            <h2>
              Step-by-Step <span className="underline-text">Buying Guide</span>
            </h2>
            <p className="section-description">
              A complete roadmap to help you confidently navigate the property
              buying process — from budgeting to registration.
            </p>
          </div>

          <div className="guide-steps-grid">
            {buyingGuideSteps.map((step, idx) => (
              <div key={idx} className="guide-step-card">
                <div className="step-number">{step.step}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                <a href="#" className="read-more">
                  Learn More <ArrowRight size={16} strokeWidth={1.5} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

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
