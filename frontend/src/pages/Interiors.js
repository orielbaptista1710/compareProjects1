import React, { useState, useCallback } from 'react';
import './Interiors.css';

// Optimized Image Component
const OptimizedImage = ({ 
  src, 
  alt, 
  width, 
  height, 
  className = "",
  loading = "lazy",
  ...props 
}) => {
  // Extract base URL without query params
  const baseUrl = src.split('?')[0];
  
  // Generate optimized URL with proper dimensions and compression
  const optimizedUrl = `${baseUrl}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;

  return (
    <img
      src={optimizedUrl}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      className={className}
      fetchPriority='high'
      {...props}
    />
  );
};

const Interiors = () => {
    const [activeTab, setActiveTab] = useState('home');
    const [activeFilter, setActiveFilter] = useState('all');

    const handleTabChange = useCallback((tab) => {
        setActiveTab(tab);
    }, []);

    const handleFilterChange = useCallback((filter) => {
        setActiveFilter(filter);
    }, []);

    // Service data with optimized image dimensions
    const homeServices = [
        {
            id: 1,
            title: "Home Interiors",
            description: "Complete home interior solutions including living rooms, bedrooms, kitchens, and more. We create spaces that reflect your personality.",
            image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a",
            width: 400,
            height: 300,
            link: "/home-interiors"
            
        },
        {
            id: 2,
            title: "Consultation & Planning",
            description: "From concept to execution, we provide expert guidance and detailed planning to ensure your project's success.",
            image: "https://images.unsplash.com/photo-1497215842964-222b430dc094",
            width: 400,
            height: 300,
            link: "/consultation"
        },
        {
            id: 3,
            title: "Kitchen Design",
            description: "Beautiful and functional kitchen designs that maximize space and efficiency while reflecting your style.",
            image: "https://images.unsplash.com/photo-1497215842964-222b430dc094",
            width: 400,
            height: 300,
            link: "/kitchen-design"
        }
    ];

    const commercialServices = [
        {
            id: 1,
            title: "Commercial Interiors",
            description: "Office, retail, and hospitality designs that enhance productivity and impress clients. Functional yet beautiful workspace solutions.",
            image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2",
            width: 400,
            height: 300,
            link: "/commercial-interiors"
        },
        {
            id: 2,
            title: "Office Design",
            description: "Create productive and inspiring work environments with our professional office interior design services.",
            image: "https://images.unsplash.com/photo-1497215842964-222b430dc094",
            width: 400,
            height: 300,
            link: "/office-design"
        },
        {
            id: 3,
            title: "Retail Design",
            description: "Attract more customers and enhance shopping experiences with our innovative retail space designs.",
            image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a",
            width: 400,
            height: 300,
            link: "/retail-design"
        }
    ];

    const portfolioItems = [
        {
            id: 1,
            title: "Modern Living Room",
            category: "residential",
            image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2",
            width: 400,
            height: 300
        },
        {
            id: 2,
            title: "Corporate Office",
            category: "commercial",
            image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2",
            width: 400,
            height: 300
        },
        {
            id: 3,
            title: "Luxury Bedroom",
            category: "residential",
            image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2",
            width: 400,
            height: 300
        },
        {
            id: 4,
            title: "Restaurant Design",
            category: "hospitality",
            image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2",
            width: 400,
            height: 300
        },
        {
            id: 5,
            title: "Minimalist Apartment",
            category: "residential",
            image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2",
            width: 400,
            height: 300
        },
        {
            id: 6,
            title: "Modern Workspace",
            category: "office",
            image: "https://images.unsplash.com/photo-1497215842964-222b430dc094",
            width: 400,
            height: 300
        }
    ];

    const filteredPortfolio = activeFilter === 'all' 
        ? portfolioItems 
        : portfolioItems.filter(item => item.category === activeFilter);

    const processSteps = [
        {
            icon: "fas fa-comments",
            title: "Consultation",
            description: "We begin with understanding your requirements, preferences, and budget."
        },
        {
            icon: "fas fa-pencil-alt",
            title: "Planning",
            description: "Our designers create detailed plans and 3D visualizations of your space."
        },
        {
            icon: "fas fa-couch",
            title: "Execution",
            description: "We handle everything from material selection to final installation."
        },
        {
            icon: "fas fa-home",
            title: "Handover",
            description: "We deliver the completed project and ensure your satisfaction."
        }
    ];

    return (
        <div className="interiors-page">

            <section className="interiors-hero">
                <div className="interiors-hero-content">
                    <h1>Transform Your Space Into Art</h1>
                    <p>Professional interior design solutions for homes and commercial spaces. Let us bring your vision to life with our expert team of designers.</p>
                    <a href="#services" className="cta-button">Explore Our Work</a>
                </div> 
            </section>

            <section id="services" className="interiors-services">
                <div className="interiors-container">
                    <h2 className="interiors-section-title">Our Services</h2>
                    <p className="interiors-section-subtitle">We offer comprehensive interior design solutions for both residential and commercial projects</p>
                    
                    <div className="interiors-tab-buttons">
                        <button 
                            className={`interiors-tab-button ${activeTab === 'home' ? 'active' : ''}`}
                            onClick={() => handleTabChange('home')}
                            aria-selected={activeTab === 'home'}
                            role="tab"
                        >
                            <i className="fas fa-home" aria-hidden="true"></i> Home Interiors
                        </button>
                        <button 
                            className={`interiors-tab-button ${activeTab === 'commercial' ? 'active' : ''}`}
                            onClick={() => handleTabChange('commercial')}
                            aria-selected={activeTab === 'commercial'}
                            role="tab"
                        >
                            <i className="fas fa-building" aria-hidden="true"></i> Commercial Interiors
                        </button>
                    </div>
                    
                    <div className={`interiors-tab-content ${activeTab === 'home' ? 'active' : ''}`} role="tabpanel">
                        <div className="interiors-service-cards">
                            {homeServices.map(service => (
                                <div key={service.id} className="interiors-service-card">
                                    <div className="interiors-service-img">
                                        <OptimizedImage 
                                            src={service.image} 
                                            alt={service.title}
                                            width={service.width}
                                            height={service.height}
                                            loading="lazy"
                                        />
                                    </div>
                                    <div className="interiors-service-content">
                                        <h3>{service.title}</h3>
                                        <p>{service.description}</p>
                                        <a href={service.link} className="cta-button">Learn More</a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className={`interiors-tab-content ${activeTab === 'commercial' ? 'active' : ''}`} role="tabpanel">
                        <div className="interiors-service-cards">
                            {commercialServices.map(service => (
                                <div key={service.id} className="interiors-service-card">
                                    <div className="interiors-service-img">
                                        <OptimizedImage 
                                            src={service.image} 
                                            alt={service.title}
                                            width={service.width}
                                            height={service.height}
                                            loading="lazy"
                                        />
                                    </div>
                                    <div className="interiors-service-content">
                                        <h3>{service.title}</h3>
                                        <p>{service.description}</p>
                                        <a href={service.link} className="cta-button">Learn More</a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="interiors-portfolio">
                <div className="interiors-container">
                    <h2 className="interiors-section-title">Our Portfolio</h2>
                    <p className="interiors-section-subtitle">Browse through our recently completed projects</p>
                    
                    <div className="interiors-portfolio-filters" role="tablist">
                        {['all', 'residential', 'commercial', 'office', 'hospitality'].map(filter => (
                            <button 
                                key={filter}
                                className={`interiors-filter-btn ${activeFilter === filter ? 'active' : ''}`}
                                onClick={() => handleFilterChange(filter)}
                                aria-selected={activeFilter === filter}
                                role="tab"
                            >
                                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                            </button>
                        ))}
                    </div>
                    
                    <div className="interiors-portfolio-grid">
                        {filteredPortfolio.map(item => (
                            <div key={item.id} className="portfolio-item">
                                <OptimizedImage 
                                    src={item.image} 
                                    alt={item.title}
                                    width={item.width}
                                    height={item.height}
                                    loading="lazy"
                                />
                                <div className="portfolio-overlay">
                                    <h3>{item.title}</h3>
                                    <p>{item.category.charAt(0).toUpperCase() + item.category.slice(1)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="interiors-process">
                <div className="interiors-container">
                    <h2 className="interiors-section-title">Our Process</h2>
                    <p className="interiors-section-subtitle">How we bring your interior design vision to life</p>
                    
                    <div className="interiors-process-steps">
                        {processSteps.map((step, index) => (
                            <div key={index} className="step">
                                <div className="step-icon">
                                    <i className={step.icon} aria-hidden="true"></i>
                                </div>
                                <h3>{step.title}</h3>
                                <p>{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Interiors;