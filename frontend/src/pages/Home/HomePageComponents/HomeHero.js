import React from "react";
import "./HomeHero.css";
import MainSearchBar from "../HomePageComponents/MainSearchBar";

const HomeHero = () => {
  return (
    <section className="home-hero">
      <div className="hero-overlay"></div>

      <div className="hero-content">
        <h1 className="h1-hero-content">Compare to Find Your Dream Home</h1>
        <p className="p-hero-content">
          Explore verified listings, check prices, and compare homes side by side to make smarter decisions.
        </p>

        <MainSearchBar />
      </div>
    </section>
  );
};

export default HomeHero;
