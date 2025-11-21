import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css'; 
import Gallery from './HomePageComponents/Gallery'; 
import MainSearchBar from './HomePageComponents/MainSearchBar';
import NavigationBar from '../../components/NavigationBar';
// import FeaturedProperties from '../components/HomePageComponents/FeaturedProperties ';
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

function Home() {
  const navigate = useNavigate();
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


      {/* <HeroSection /> */}

      <FullWidthSection>
      <section>
      <HomeHero />
      {compareList.length > 0 && (
        <CompareBar 
          compareList={compareList}
          removeFromCompare={removeFromCompare}
        />
      )}
      </section>
      </FullWidthSection>


    <BaseLayout>

      <section>
      {/* <FeaturedProperties /> */}
      </section>


      {/* Team Section */}
      <section>
      <RecentlyAdded />
      </section>

      </BaseLayout>

      <FullWidthSection>
      {/* Post Property Section */}
      <section>
        <PostPropertyBanner />
      </section>
      </FullWidthSection>



      <BaseLayout>

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
    </BaseLayout>

      <FullWidthSection>

      {/* Testimonial Section */}
      <section>
        <TestimonialSection />
      </section>

      </FullWidthSection>

      <FullWidthSection>
      {/* Post Property Section */}
      <section>
        <ContactUsBanner />
      </section>
      </FullWidthSection>



      <BaseLayout>
      {/* Contact Section */}
      <section id="contact-section">
        <ContactForm />
      </section>
      </BaseLayout>


    </div>
  );
}

export default Home;
