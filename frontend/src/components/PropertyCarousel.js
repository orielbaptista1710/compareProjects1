import React from 'react';
import './PropertyCarousel.css';

const PropertyCarousel = () => {
  // Dummy data matching your image style
  const properties = [
    {
      id: 1,
      status: 'For Sale',
      price: '$550,000',
      title: 'North Dillard Street',
      address: '20-30 Steinway St, Queens, NY',
      beds: 4,
      baths: 1,
      sqft: 1200,
      agent: 'John Powell',
      posted: '3 years ago',
      image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 2,
      status: 'For Rent',
      price: '$3,200/mo',
      title: 'Modern Downtown Loft',
      address: '45 W 34th St, Manhattan, NY',
      beds: 2,
      baths: 2,
      sqft: 950,
      agent: 'Sarah Johnson',
      posted: '2 weeks ago',
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 3,
      status: 'For Sale',
      price: '$1,250,000',
      title: 'Luxury Waterfront',
      address: '15 Beachside Ave, Brooklyn, NY',
      beds: 5,
      baths: 3,
      sqft: 2400,
      agent: 'Michael Chen',
      posted: '1 month ago',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    }
  ];

  return (
    <div className="property-carousel">
      <h2 className="carousel-title">Featured Properties</h2>
      <div className="carousel-container">
        {properties.map(property => (
          <div key={property.id} className="property-card">
            <div className="property-badge">{property.status}</div>
            <img src={property.image} alt={property.title} className="property-image" loading="lazy"/>
            <div className="caro-property-details">
              <div className="caro-property-price">{property.price}</div>
              <h3 className="caro-property-title">{property.title}</h3>
              <p className="property-address">{property.address}</p>
              <div className="property-features">
                <span><strong>Beds:</strong> {property.beds}</span>
                <span><strong>Baths:</strong> {property.baths}</span>
                <span><strong>Sqft:</strong> {property.sqft}</span>
              </div>
              <div className="property-agent">
                <span>{property.agent}</span>
                <span>{property.posted}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PropertyCarousel;