//this is used in DevDashboardPage.js to modulized the property list for the developer dashboard

import React, { useState, useCallback } from 'react';
import { List  } from 'react-window';
import { Collapse } from 'react-collapse';
// import API from '../api';
// import './PropertyList.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const PropertyCardDashboard = ({ property, index, style, onEdit, onDelete, formatIndianPrice }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleCollapse = () => setIsOpen(prev => !prev);

  return (
    <div className="property-card" style={style} tabIndex={0}>
      <div className="dashboard-property-header">
        <h4>{property.title}</h4>
        <div
          className="property-status"
          style={{
            color:
              property.status === 'approved'
                ? 'green'
                : property.status === 'rejected'
                ? 'red'
                : 'orange',
          }}
        >
          {property.status}
        </div>
      </div>

      {property.coverImage && (
        <div className="property-cover">
          <img
            src={
              property.coverImage.startsWith('http')
                ? property.coverImage
                : `${API_BASE_URL}${property.coverImage}`
            }
            alt={`${property.title} cover image`}
            loading="lazy"
            onError={(e) => (e.target.src = '/placeholder-property.jpg')}
          />
        </div>
      )}

      <button
        className="collapse-button"
        onClick={toggleCollapse}
        aria-expanded={isOpen}
        aria-controls={`property-details-${property._id}`}
      >
        {isOpen ? 'Hide Details ▲' : 'Show Details ▼'}
      </button>

      <Collapse isOpened={isOpen}>
        <div id={`property-details-${property._id}`} className="property-details">


             {/* Cover Image */}
                      {property.coverImage && (
  <div className="property-cover">
    <img
      src={
        property.coverImage.startsWith('http')
          ? property.coverImage
          : `${API_BASE_URL}${property.coverImage}`
      }
      loading="lazy"
      alt={`Cover of ${property.title}`}
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = '/placeholder-property.jpg';
      }}
    />
  </div>
)}


    <div className="dashboard-property-details">
        <div className="detail-row">
          <span className="detail-label">Location:</span>
          <span>{property.state},{property.locality}, {property.city}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Address:</span>
          <span>{property.address},{property.pincode}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Map Link:</span>
          <span>{property.mapLink}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Property Type:</span>
          <span>{property.propertyType}</span>
        </div>
        <div className='detail-row'>
          <span className="detail-label">Furnishing:</span>
          <span>{property.furnishing}</span>
        </div>
        <div className='detail-row'>
          <span className="detail-label">Possession Status:</span>
          <span>{property.possessionStatus}</span>
        </div>

        <div className='detail-row'>
          <span className="detail-label">BHK:</span>
          <span>{property.bhk}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Bathrooms:</span>
          <span>{property.bathrooms}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Balconies:</span>
          <span>{property.balconies}</span>
        </div>

        <div className='detail-row'>
          <span className="detail-label">Facing:</span>
          <span>{property.facing}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Developer Name:</span>
          <span>{property.developerName }</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Price:</span>
          <span>{formatIndianPrice(property.price)}(₹{(property.price)})</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Area:</span>
          <span>
            {property.area?.value} {property.area?.unit}
          </span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Property Age:</span>
          <span>{property.ageOfProperty}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Total Floors:</span>
          <span>{property.totalFloors}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Floor No:</span>
          <span>{property.floor}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Units Availability:</span>
          <span>{property.unitsAvailable}</span>
        </div>

        <div className="detail-row">
        <span className="detail-label">Availability Date:</span>
  
        <span>
        {property.reraDate 
          ? new Date(property.reraDate).toLocaleString('en-IN', {
              timeZone: 'Asia/Kolkata',
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : 'Not set'}
        </span>
    </div>


        <div className="detail-row">
          <span className="detail-label"> RERA Approved:</span>
          <span>{property.reraApproved ? '✅' : '❌'}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label"> RERA No:</span>
          <span>{property.reraNumber}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Price is negotiable:</span>
          <span>{property.priceNegotiable ? '✅' : '❌'}</span>
        </div>

        {/* <div className="detail-row">
  <span className="detail-label">Amenities:</span>
  <span>{(property.amenities || []).join(', ')}</span>
</div>

<div className="detail-row">
  <span className="detail-label">Facilities:</span>
  <span>{(property.facilities || []).join(', ')}</span>
</div>

<div className="detail-row">
  <span className="detail-label">Security:</span>
  <span>{(property.security || []).join(', ')}</span>
</div> */}


      </div>

                      <div className="property-description">
                        <h5>Description:</h5>
                        <p>{property.description}</p>
                        {property.long_description && (
                          <>
                            <h5>Details:</h5>
                            <p>{property.long_description}</p>
                          </>
                        )}
                      </div>



                      {property.floorplanImages && property.floorplanImages.length > 0 && (
                        <div className="property-floorplans">
                          <h5>Floor Plans ({property.floorplanImages.length})</h5>
                          <div className="floorplan-grid">
                            {property.floorplanImages.map((img, index) => (
                              <div key={index} className="floorplan-item">
                                <img 
                                  src={`${API_BASE_URL}${img}`} 
                                  alt={`Floorplan ${index}`}
                                  onError={(e) => {
                                    e.target.onerror = null; 
                                    e.target.src = '/placeholder-floorplan.jpg';
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}



          {property.galleryImages?.length > 0 && (
            <div className="property-gallery">
              {property.galleryImages.map((img, idx) => (
                <img
                  key={idx}
                  src={img.startsWith('http') ? img : `${API_BASE_URL}${img}`}
                  alt={`${property.title} gallery ${idx}`}
                  loading="lazy"
                  onError={(e) => (e.target.src = '/placeholder-property.jpg')}
                />
              ))}
            </div>
          )}

                      {/* Media Files */}
                      {property.mediaFiles && property.mediaFiles.length > 0 && (
                        <div className="property-media">
                          <h5>Media Files ({property.mediaFiles.length})</h5>
                          <div className="media-grid">
                            {property.mediaFiles.map((file, index) => (
                              <div key={index} className="media-item">
                                {file.type === 'image' ? (
                                  <img 
                                    src={`${API_BASE_URL}${file.src}`} 
                                    alt={`Media ${index}`}
                                    onError={(e) => {
                                      e.target.onerror = null; 
                                      e.target.src = '/placeholder-image.jpg';
                                    }}
                                  />
                                ) : (
                                  <div className="video-container">
                                    <video controls>
                                      <source 
                                        src={`${API_BASE_URL}${file.src}`} 
                                        type={`video/${file.src.split('.').pop()}`} 
                                      />
                                    </video>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

          <div className="property-actions">
            <button onClick={() => onEdit(property)} className="edit-button">
              Edit
            </button>
            <button onClick={() => onDelete(property._id)} className="delete-button">
              Delete
            </button>
          </div>
        </div>
      </Collapse>
    </div>
  );
};

const PropertyList = ({ properties, onEdit, onDelete, formatIndianPrice }) => {
  const Row = ({ index, style }) => (
    <PropertyCardDashboard
      property={properties[index]}
      index={index}
      style={style}
      onEdit={onEdit}
      onDelete={onDelete}
      formatIndianPrice={formatIndianPrice}
    />
  );

  return (
    <List
      height={600} // Adjust to fit your dashboard
      itemCount={properties.length}
      itemSize={400} // Adjust based on collapsed/expanded height
      width="100%"
    >
      {Row}
    </List>
  );
};

export default PropertyList;
