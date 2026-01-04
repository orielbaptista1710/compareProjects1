import React from "react";
import "./HomeHero.css";
import MainSearchBar from "../HomePageComponents/MainSearchBar";
import { useCity } from "../../../contexts/CityContext";

const HomeHero = () => {
  const { city } = useCity();

  return (
    <header className="home-hero" role="banner" aria-label="Home search hero">
      <div className="hero-overlay" aria-hidden="true" />

      <div className="hero-content">
        <h1 className="h1-hero-content">
          Compare to Find Your Dream Home
        </h1>

        <p className="p-hero-content">
          Explore verified listings, compare prices, and discover top projects in{" "}
          <strong>{city}</strong> — all in one place.
        </p>

        {/* Pass city down so search is city-aware */}
        <MainSearchBar city={city} />
      </div>
    </header>
  );
};

export default HomeHero;
