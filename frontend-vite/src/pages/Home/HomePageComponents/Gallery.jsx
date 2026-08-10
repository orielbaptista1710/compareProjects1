import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Gallery.css';
import galleryimg1 from '../../../assests/images/image1.jpg';
import galleryimg2 from '../../../assests/images/image2.jpg';
import galleryimg3 from '../../../assests/images/image3.jpg';

const LOCATIONS = [
  {
    id: 'mumbai',
    city: 'Mumbai',
    localities: [],
    image: galleryimg1,
    alt: 'Modern apartment skyline in Mumbai',
    title: 'Mumbai',
    description: "Discover luxury properties in India's financial capital",
    variant: 'featured',
  },
  {
    id: 'bandra',
    city: 'Mumbai',
    localities: ['Bandra West'],
    image: galleryimg2,
    alt: 'Luxury seafront properties in Bandra West',
    title: 'Bandra',
    description: "Premium properties in Mumbai's most sought-after locality",
    variant: 'secondary',
  },
  {
    id: 'vasai',
    city: 'Mumbai',
    localities: ['Vasai'],
    image: galleryimg3,
    alt: 'Affordable residential properties in Vasai',
    title: 'Vasai',
    description: "Budget-friendly options in Mumbai's suburban area",
    variant: 'secondary',
  },
];

const ArrowIcon = () => (
  <svg
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    className="gal-btn__arrow"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const GalleryCard = memo(({ location, onClick }) => {
  const { id, city, localities, image, alt, title, description, variant } = location;

  const handleCardClick = useCallback(() => {
    onClick(city, localities);
  }, [onClick, city, localities]);

  const handleBtnClick = useCallback((e) => {
    e.stopPropagation();
    onClick(city, localities);
  }, [onClick, city, localities]);

  return (
    <div
      className={`gal-card gal-card--${variant}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      aria-label={`Explore properties in ${title}`}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
    >
      <img
        src={image}
        alt={alt}
        className="gal-card__img"
        loading="lazy"
        decoding="async"
      />
      <div className="gal-card__overlay" aria-hidden="true" />
      <div className="gal-card__content">
        <h2 className="gal-card__title" id={`gal-card-${id}`}>
          {title}
        </h2>
        <p className="gal-card__desc">{description}</p>
        <button
          className="gal-explore-btn"
          onClick={handleBtnClick}
          aria-label={`View properties in ${title}`}
        >
          Explore
          <ArrowIcon />
        </button>
      </div>
    </div>
  );
});

GalleryCard.displayName = 'GalleryCard';

const Gallery = () => {
  const navigate = useNavigate();

  const handleExploreCity = useCallback((city, localities = []) => {
    const params = new URLSearchParams();
    params.append('city', city);
    localities.forEach((l) => params.append('locality', l));
    navigate(`/properties?${params.toString()}`);
  }, [navigate]);

  const [featured, ...secondary] = LOCATIONS;

  return (
    <section className="gal-section" aria-labelledby="gal-heading">
      <div className="gal-header">
        <span className="gal-eyebrow">Explore by Location</span>
        <h2 id="gal-heading" className="gal-heading">Find Your City</h2>
        <div className="gal-underline" aria-hidden="true" />
      </div>

      <div className="gal-container">
        <GalleryCard location={featured} onClick={handleExploreCity} />
        <div className="gal-secondary-grid">
          {secondary.map((loc) => (
            <GalleryCard key={loc.id} location={loc} onClick={handleExploreCity} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default memo(Gallery);