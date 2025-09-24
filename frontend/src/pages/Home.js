import React from 'react';
import './Home.css'; 
import Gallery from '../components/HomePageComponents/Gallery'; 
import MainSearchBar from '../components/HomePageComponents/MainSearchBar';
import NavigationBar from '../components/NavigationBar';
import FeaturedProperties from '../components/HomePageComponents/FeaturedProperties ';
import RecentlyAdded from '../components/HomePageComponents/RecentlyAdded';
import PostPropertyBanner from '../components/HomePageComponents/PostPropertyBanner';
import HeroSection from '../components/HomePageComponents/HeroSection';
import About from '../components/HomePageComponents/About';
import ContactForm from '../components/HomePageComponents/ContactForm';
import TestimonialSection from '../components/HomePageComponents/TestimonialSection';

function Home() {

    
  return (
    <div>
      
       <NavigationBar />
      
      {/* Landing Section */}
      <section id="homee" className="landing-section">
            <div className="overlay">
                <div className="search-bar-container">
                <MainSearchBar />
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

      <section>
        <About />
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
