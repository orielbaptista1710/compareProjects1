import React from 'react';
import './Home.css'; 
import Gallery from '../components/Gallery'; 
import MainSearchBar from '../components/MainSearchBar';
import HeroSection from '../components/HeroSection';
import NavigationBar from '../components/NavigationBar';
import FeaturedProperties from '../components/FeaturedProperties ';
import RecentlyAdded from '../components/RecentlyAdded';
import PostPropertyBanner from '../components/PostPropertyBanner';
import ContactForm from '../components/ContactForm';
import TestimonialSection from '../components/TestimonialSection';
import ExpandableSearch from '../components/ExpandableSearch';

function Home() {

    
  return (
    <div>
      
       <NavigationBar />
      
      {/* Landing Section */}
      <section id="homee" className="landing-section">
            <div className="overlay">
              <div className="container">
                <div className="search-bar-container">
                <MainSearchBar />
                <ExpandableSearch />
                </div>
              </div>
            </div>
      </section>

      <section>
      <FeaturedProperties />
      </section>

      {/* Team Section */}
      <section>
      <RecentlyAdded />
      </section>

      {/* Post Property Section */}
      <section>
        <PostPropertyBanner />
      </section>

      

      <section style={{padding: '100px'}}>
        <HeroSection />
      </section>


      {/* Gallery Section */}
      <section>
        <Gallery />
      </section>
      


      {/* Testimonial Section */}
      <section>
        <TestimonialSection />
      </section>

      

      {/* Contact Section */}
      <section>
        <ContactForm />
      </section>

    </div>
  );
}

export default Home;
