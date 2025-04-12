import React, {useState} from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css'; // Import your CSS file if you have styles
import Gallery from '../components/Gallery'; 
// import Contact from '../components/Contact'; 
import MainSearchBar from '../components/MainSearchBar';
import HeroSection from '../components/HeroSection';
// //import Button from '../components/Button';
import WhatsAppSidebar from '../components/WhatsAppSidebar';
import NavigationBar from '../components/NavigationBar';
// import PropertyCarousel from '../components/PropertyCarousel';
function Home() {

  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

   const handleSeachSubmit = (event) => {
      event.preventDefault();
      navigate(`/properties?search=${encodeURIComponent(searchTerm)}`);
   }

  
    const handleViewPropertiesClick = () => {
      navigate('/properties');
    };
    

  return (
    <div>
       <NavigationBar />
      
            <WhatsAppSidebar /> 

      {/* Landing Section */}
<section id="homee" className="landing-section">
 

  
      <div className="overlay">
        <div className="container">
          {/* Search Bar on the left */}
      <div className="search-bar-container">
        <MainSearchBar />
      </div>

      {/* <PropertyCarousel /> */}


      {/* <div className="content">
          <h1>Find Your Dream Property</h1>
          <p>Explore the finest properties in your area with us.</p>

          <button className='home-button' onClick={handleViewPropertiesClick}>
            Compare Now
          </button>
          

       </div> */}
          
        </div>
      </div>
    </section>


      {/* Team Section */}
      <section className="team-section">
        <div className="container-feature">
          <div className="section-title">
            <h1>Featured Properties</h1>
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
