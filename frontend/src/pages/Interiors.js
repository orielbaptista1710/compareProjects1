import React, { useState } from 'react';
import NavigationBar from '../components/NavigationBar';
import './Interiors.css';

const Interiors = () => {
    const [activeTab, setActiveTab] = useState('home');
    const [activeFilter, setActiveFilter] = useState('all');

    return (
        <div className="interiors-page">

        {/* <NavigationBar /> */}

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
                            onClick={() => setActiveTab('home')}
                        >
                            <i className="fas fa-home"></i> Home Interiors
                        </button>
                        <button 
                            className={`interiors-tab-button ${activeTab === 'commercial' ? 'active' : ''}`}
                            onClick={() => setActiveTab('commercial')}
                        >
                            <i className="fas fa-building"></i> Commercial Interiors
                        </button>
                    </div>
                    
                    <div className={`interiors-tab-content ${activeTab === 'home' ? 'active' : ''}`}>
                        <div className="interiors-service-cards">
                            <div className="interiors-service-card">
                                <div className="interiors-service-img">
                                    <img src="https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80" alt="Residential Interior Design" />
                                </div>
                                <div className="interiors-service-content">
                                    <h3>Home Interiors</h3>
                                    <p>Complete home interior solutions including living rooms, bedrooms, kitchens, and more. We create spaces that reflect your personality.</p>
                                    <a href="/home-interiors" className="cta-button">Learn More</a>
                                </div>
                            </div>
                            
                            <div className="interiors-service-card">
                                <div className="service-img">
                                    <img src="https://images.unsplash.com/photo-1497215842964-222b430dc094?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" alt="Consultation & Planning" />
                                </div>
                                <div className="service-content">
                                    <h3>Consultation & Planning</h3>
                                    <p>From concept to execution, we provide expert guidance and detailed planning to ensure your project's success.</p>
                                    <a href="/consultation" className="cta-button">Learn More</a>
                                </div>
                            </div>
                            
                            <div className="interiors-service-card">
                                <div className="service-img">
                                    <img src="https://images.unsplash.com/photo-1497215842964-222b430dc094?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" alt="Kitchen Design" />
                                </div>
                                <div className="service-content">
                                    <h3>Kitchen Design</h3>
                                    <p>Beautiful and functional kitchen designs that maximize space and efficiency while reflecting your style.</p>
                                    <a href="/kitchen-design" className="cta-button">Learn More</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className={`interiors-tab-content ${activeTab === 'commercial' ? 'active' : ''}`}>
                        <div className="interiors-service-cards">
                            <div className="interiors-service-card">
                                <div className="service-img">
                                    <img src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1500&q=80" alt="Commercial Interior Design" />
                                </div>
                                <div className="service-content">
                                    <h3>Commercial Interiors</h3>
                                    <p>Office, retail, and hospitality designs that enhance productivity and impress clients. Functional yet beautiful workspace solutions.</p>
                                    <a href="/commercial-interiors" className="cta-button">Learn More</a>
                                </div>
                            </div>
                            
                            <div className="interiors-service-card">
                                <div className="service-img">
                                    <img src="https://images.unsplash.com/photo-1497215842964-222b430dc094?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" alt="Office Design" />
                                </div>
                                <div className="service-content">
                                    <h3>Office Design</h3>
                                    <p>Create productive and inspiring work environments with our professional office interior design services.</p>
                                    <a href="/office-design" className="cta-button">Learn More</a>
                                </div>
                            </div>
                            
                            <div className="interiors-service-card">
                                <div className="service-img">
                                    <img src="https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80" alt="Retail Design" />
                                </div>
                                <div className="service-content">
                                    <h3>Retail Design</h3>
                                    <p>Attract more customers and enhance shopping experiences with our innovative retail space designs.</p>
                                    <a href="/retail-design" className="cta-button">Learn More</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="interiors-portfolio">
                <div className="interiors-container">
                    <h2 className="interiors-section-title">Our Portfolio</h2>
                    <p className="interiors-section-subtitle">Browse through our recently completed projects</p>
                    
                    <div className="interiors-portfolio-filters">
                        <button 
                            className={`interiors-filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('all')}
                        >
                            All
                        </button>
                        <button 
                            className={`interiors-filter-btn ${activeFilter === 'residential' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('residential')}
                        >
                            Residential
                        </button>
                        <button 
                            className={`interiors-filter-btn ${activeFilter === 'commercial' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('commercial')}
                        >
                            Commercial
                        </button>
                        <button 
                            className={`interiors-filter-btn ${activeFilter === 'office' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('office')}
                        >
                            Office
                        </button>
                        <button 
                            className={`interiors-filter-btn ${activeFilter === 'hospitality' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('hospitality')}
                        >
                            Hospitality
                        </button>
                    </div>
                    
                    <div className="interiors-portfolio-grid">
                        <div className="portfolio-item">
                            <img src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1500&q=80" alt="Modern Living Room" />
                            <div className="portfolio-overlay">
                                <h3>Modern Living Room</h3>
                                <p>Residential</p>
                            </div>
                        </div>
                        
                        <div className="portfolio-item">
                            <img src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1500&q=80" alt="Corporate Office" />
                            <div className="portfolio-overlay">
                                <h3>Corporate Office</h3>
                                <p>Commercial</p>
                            </div>
                        </div>
                        
                        <div className="portfolio-item">
                            <img src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1500&q=80" alt="Luxury Bedroom" />
                            <div className="portfolio-overlay">
                                <h3>Luxury Bedroom</h3>
                                <p>Residential</p>
                            </div>
                        </div>
                        
                        <div className="portfolio-item">
                            <img src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1500&q=80" alt="Restaurant Design" />
                            <div className="portfolio-overlay">
                                <h3>Restaurant Design</h3>
                                <p>Hospitality</p>
                            </div>
                        </div>
                        
                        <div className="portfolio-item">
                            <img src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1500&q=80" alt="Minimalist Apartment" />
                            <div className="portfolio-overlay">
                                <h3>Minimalist Apartment</h3>
                                <p>Residential</p>
                            </div>
                        </div>
                        
                        <div className="portfolio-item">
                            <img src="https://images.unsplash.com/photo-1497215842964-222b430dc094?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80" alt="Modern Workspace" />
                            <div className="portfolio-overlay">
                                <h3>Modern Workspace</h3>
                                <p>Office</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="interiors-process">
                <div className="interiors-container">
                    <h2 className="interiors-section-title">Our Process</h2>
                    <p className="interiors-section-subtitle">How we bring your interior design vision to life</p>
                    
                    <div className="interiors-process-steps">
                        <div className="step">
                            <div className="step-icon">
                                <i className="fas fa-comments"></i>
                            </div>
                            <h3>Consultation</h3>
                            <p>We begin with understanding your requirements, preferences, and budget.</p>
                        </div>
                        
                        <div className="step">
                            <div className="step-icon">
                                <i className="fas fa-pencil-alt"></i>
                            </div>
                            <h3>Planning</h3>
                            <p>Our designers create detailed plans and 3D visualizations of your space.</p>
                        </div>
                        
                        <div className="step">
                            <div className="step-icon">
                                <i className="fas fa-couch"></i>
                            </div>
                            <h3>Execution</h3>
                            <p>We handle everything from material selection to final installation.</p>
                        </div>
                        
                        <div className="step">
                            <div className="step-icon">
                                <i className="fas fa-home"></i>
                            </div>
                            <h3>Handover</h3>
                            <p>We deliver the completed project and ensure your satisfaction.</p>
                        </div>
                    </div>
                </div>
            </section>

            

            
        </div>
    );
};

export default Interiors;