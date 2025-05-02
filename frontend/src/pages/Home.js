import React from 'react';
import './Home.css'; 
import Gallery from '../components/Gallery'; 
import MainSearchBar from '../components/MainSearchBar';
import HeroSection from '../components/HeroSection';
import WhatsAppSidebar from '../components/WhatsAppSidebar';
import NavigationBar from '../components/NavigationBar';
import FeaturedProperties from '../components/FeaturedProperties ';


function Home() {

    
  return (
    <div>
      
       <NavigationBar />
      
            <WhatsAppSidebar /> 

      {/* Landing Section */}
<section id="homee" className="landing-section">
 
      <div className="overlay">
        <div className="container">
      <div className="search-bar-container">
        <MainSearchBar />
      </div>
        </div>
      </div>
</section>

<section>
  <FeaturedProperties />
</section>



      {/* Team Section */}
      <section className="team-section">
        <div className="container-feature">
          <div className="section-title">
            <h1>Recently Added Properties</h1>
            <p>We are a dedicated team, passionate about connecting you with your ideal property.</p>
            {/* <CaroForHome /> */}
          </div>
        </div>
      </section>

      <section>
        <HeroSection />
      </section>
      

      {/* Gallery Section */}
      <section>
        <Gallery />
      </section>

      {/* Contact Section */}
      <section>
        {/* <Contact /> */}
      </section>

    </div>
  );
}

export default Home;
