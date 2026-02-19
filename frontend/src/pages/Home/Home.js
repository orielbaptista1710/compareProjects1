import React from 'react';

//components import 
import Gallery from './HomePageComponents/Gallery'; 
import NavigationBar from '../../shared/NavigationBar/NavigationBar';
import DiscoverFeaturedProjects from '../Home/HomePageComponents/DiscoverFeaturedProjects';
import RecentlyAdded from './HomePageComponents/RecentlyAdded';
import PostPropertyBanner from './HomePageComponents/PostPropertyBanner';
import ContactUsBanner from './HomePageComponents/ContactUsBanner';
import HeroSection from './HomePageComponents/HeroSection';
import About from './HomePageComponents/About';
import ContactForm from './HomePageComponents/ContactForm';
import TestimonialSection from './HomePageComponents/TestimonialSection';
import Seo from '../../database/Seo';
import HomeHero from './HomePageComponents/HomeHero';
import { useCompare } from '../../contexts/CompareContext';
import CompareBar from './HomePageComponents/CompareBar';
import BaseLayout from '../../layouts/BaseLayout';
import FullWidthSection from '../../layouts/FullWidthSection';
import AnnouncementStrip from './HomePageComponents/AnnouncementStrip';
import RankedProjects from '../Home/HomePageComponents/RankedProjects'
function Home() {
  // const navigate = useNavigate();
  const {compareList , removeFromCompare } = useCompare();

  return (

    <div>

      <Seo
        title="CompareProjects | Find & Compare Real Estate Projects"
        description="Search, compare, and discover the best real estate projects in India. Get detailed insights before you buy."
        // url="https://www.compareprojects.com/"
        // image="https://www.compareprojects.com/assets/home-og.jpg"
      />
 

       <NavigationBar />

       {/* ✅ Secondary info */}
      <AnnouncementStrip />


      {/* <HeroSection /> */}

      

      {/* <FullWidthSection> */}
      <section>
      <HomeHero />
      {compareList.length > 0 && (
        <CompareBar 
          compareList={compareList}
          removeFromCompare={removeFromCompare}
          
        />
      )}
      </section>

      <RankedProjects />

      <section>
      <DiscoverFeaturedProjects />
      </section>
      

      {/* </FullWidthSection> */}

    {/* <BaseLayout> */}


      {/* Team Section */}
      <section>
      <RecentlyAdded />
      </section>

      {/* </BaseLayout> */}

      {/* <FullWidthSection> */}
      {/* Post Property Section */}
      <section>
        <PostPropertyBanner />
      </section>
      {/* </FullWidthSection> */}



      {/* <FullWidthSection> */}

      <section>
        <About />
      </section>
      
      <section >
        <HeroSection />
      </section>


      {/* Gallery Section */}
      <section>
        <Gallery />
      </section>
    {/* </FullWidthSection> */}

      {/* <BaseLayout> */}

      {/* Testimonial Section */}
      <section>
        <TestimonialSection />
      </section>

      {/* </BaseLayout> */}

      {/* <FullWidthSection> */}
      {/* Post Property Section */}
      <section>
        <ContactUsBanner />
      </section>
      {/* </FullWidthSection> */}



      {/* <BaseLayout> */}
      {/* Contact Section */}
      <section id="contact-section">
        <ContactForm />
      </section>
      {/* </BaseLayout> */}


    </div>
  );
}

export default Home;
