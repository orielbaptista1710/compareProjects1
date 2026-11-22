import "./HomeHero.css";
import MainSearchBar from "../../../features/search/MainSearchBar/MainSearchBar";
import { useCity } from "../../../contexts/CityContext";
// import MascotGuide from "../../../components/DevDashboardPageComponents/Mascot/MascotGuide";

// The first word of the headline cycles through what the site does. Each one
// reads naturally before "to Find Your Dream Home"; the first is the default
// for screen readers and for people who prefer reduced motion.
const ROTATING_WORDS = ["Compare", "Search", "Explore", "Choose"];

const HomeHero = () => {
  const { city } = useCity();

  return (
    <header className="home-hero" role="banner" aria-label="Home search hero">
      <div className="hero-overlay" aria-hidden="true" />

      <div className="hero-content">
        <div className="hero-content-overlay">
        <h1 className="h1-hero-content" aria-label={`${ROTATING_WORDS[0]} to Find Your Dream Home`}>
          <span className="hero-rotator" aria-hidden="true">
            {ROTATING_WORDS.map((word) => (
              <span key={word} className="hero-rotator-word">{word}</span>
            ))}
          </span>{" "}
          <span className="hero-title-rest" aria-hidden="true">to Find Your Dream Home</span>
        </h1>

        <p className="p-hero-content">
          Explore verified listings, compare prices, and discover top projects in{" "}
          <strong>{city}</strong> — all in one place.
        </p>

        {/* Pass city down so search is city-aware */}
        <MainSearchBar city={city} />
        </div>
      </div>

      {/* <MascotGuide
  steps={[
    "Welcome! Use filters to narrow properties.",
    "Click a property to see full details.",
    "You can contact sellers directly."
  ]}
/> */}
    </header>
  );
};

export default HomeHero;
