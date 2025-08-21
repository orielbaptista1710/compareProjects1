import React,  { useState, useEffect } from 'react';
import { 
  amenitiesList,
  facilitiesList,
  securityList
} from '../constants/propertyFormConstants';
import './SellPropertyForm.css';
import locationData from '../database/locationData';
import { Alert } from 'antd';
import MediaUploadTabs from './MediaUploadTabs';
import PropertyInformationSection from './property-form/PropertyInformationSection';
import LocationDetailsSection from './property-form/LocationDetailsSection';
import PropertyDetailsSection from './property-form/PropertyDetailsSection';


const SellPropertyForm = ({
  formData,
  setFormData,
  editingId,
  isAdding,
  isUpdating,
  error,
  success,
  handleChange,
  onSubmit,
  handleCancelEdit
}) => {

  // const steps = ['Contact', 'Info', 'Location', 'Details', 'Media', 'Submit'];
  // const [currentStep, setCurrentStep] = useState(0);

  const [mediaData, setMediaData] = useState({
    coverImage: '',
    galleryImages: [],
    floorplanImages: [],
    mediaFiles: [],
  });


  // State variables
  const [selectedState, setSelectedState] = useState(formData.state || '');
  const [selectedCity, setSelectedCity] = useState(formData.city || '');
  // const [landmarkInput, setLandmarkInput] = useState('');
  const [landmarks, setLandmarks] = useState(Array.isArray(formData.landmarks) ? formData.landmarks : []);
  const [availableFrom, setAvailableFrom] = useState(null);
  const [selectedAmenities, setSelectedAmenities] = useState(Array.isArray(formData.amenities) ? formData.amenities : []);
  const [selectedFacilities, setSelectedFacilities] = useState(Array.isArray(formData.facilities) ? formData.facilities : []);
  const [selectedSecurity, setSelectedSecurity] = useState(Array.isArray(formData.security) ? formData.security : []);

  // Sync state with formData changes (important for editing)
  useEffect(() => {
    setSelectedState(formData.state || '');
    setSelectedCity(formData.city || '');
    setLandmarks(Array.isArray(formData.landmarks) ? formData.landmarks : []);
    setSelectedAmenities(Array.isArray(formData.amenities) ? formData.amenities : []);
    setSelectedFacilities(Array.isArray(formData.facilities) ? formData.facilities : []);
    setSelectedSecurity(Array.isArray(formData.security) ? formData.security : []);
    setAvailableFrom(formData.availableFrom ? new Date(formData.availableFrom) : null);

  }, [formData]);

  const handleStateChange = (e) => {
    const state = e.target.value;
    setSelectedState(state);
    setSelectedCity('');
    setFormData({ ...formData, state, city: '', locality: '' });
  };

  const handleCityChange = (e) => {
    const city = e.target.value;
    setSelectedCity(city);
    setFormData({ ...formData, city, locality: '' });
  };

  const handleLocalityChange = (e) => {
    setFormData({ ...formData, locality: e.target.value });
  };


  const handleCheckboxChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: Array.isArray(prev[name]) 
        ? (prev[name].includes(value)
          ? prev[name].filter(item => item !== value)
          : [...prev[name], value])
        : [value]
    }));
  };

  const handleAmenityChange = (amenity) => {
    const updatedAmenities = selectedAmenities.includes(amenity)
      ? selectedAmenities.filter(item => item !== amenity)
      : [...selectedAmenities, amenity];
    setSelectedAmenities(updatedAmenities);
    setFormData(prev => ({ ...prev, amenities: updatedAmenities }));
  };

  const handleFacilityChange = (facility) => {
    const updatedFacilities = selectedFacilities.includes(facility)
      ? selectedFacilities.filter(item => item !== facility)
      : [...selectedFacilities, facility];
    setSelectedFacilities(updatedFacilities);
    setFormData(prev => ({ ...prev, facilities: updatedFacilities }));
  };

  const handleSecurityChange = (security) => {
    const updatedSecurity = selectedSecurity.includes(security)
      ? selectedSecurity.filter(item => item !== security)
      : [...selectedSecurity, security];
    setSelectedSecurity(updatedSecurity);
    setFormData(prev => ({ ...prev, security: updatedSecurity }));
  };

  const handleRadioChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date) => {
  setAvailableFrom(date);
  setFormData(prev => ({ 
    ...prev, 
    availableFrom: date ? date.toISOString() : null
  }));
};

  const handleAreaValueChange = (value) => {
  setFormData(prev => ({
    ...prev,
    area: {
      ...prev.area,
      value: value || 0 
    }
  }));
};

  const handleAreaUnitChange = (unit) => {
  setFormData(prev => ({
    ...prev,
    area: {
      ...prev.area,
      unit: unit
    }
  }));
};

  const handleSubmit = (e) => {
    e.preventDefault();

    onSubmit({
      ...formData,
      landmarks: landmarks,
      amenities: selectedAmenities,
      facilities: selectedFacilities,
      security: selectedSecurity,
      parkings: Array.isArray(formData.parkings) ? formData.parkings : [formData.parkings].filter(Boolean),
      area: formData.area || { value: '', unit: 'sqft' },
      availableFrom: availableFrom ? availableFrom.toISOString() : null,
      priceNegotiable: formData.priceNegotiable || false,
      reraApproved: formData.reraApproved || false,
      reraNumber: formData.reraApproved ? formData.reraNumber : '',
      media: mediaData,

    });
  };

  return (
    <div className="form-container">

      <h2 className="form-title">
        {editingId ? 'Edit Property Listing' : 'Add a New Property'}
      </h2>
      <p className="form-subtitle">
        Welcome to your property dashboard. Use this form to provide complete details about your property.
        <br />
        Make sure all required information is accurate to attract potential buyers or renters.
      </p>


      {error && <Alert message={error} type="error" showIcon className="alert" />}
      {success && <Alert message={success} type="success" showIcon className="alert" />}


      <form className="sellform-group" onSubmit={handleSubmit}>

        <PropertyInformationSection 
          formData={formData} 
          handleChange={handleChange} 
        />

        <LocationDetailsSection 
          formData={formData}
          selectedState={selectedState}
          selectedCity={selectedCity}
          handleStateChange={handleStateChange}
          handleCityChange={handleCityChange}
          handleLocalityChange={handleLocalityChange}
          handleChange={handleChange}
          locationData={locationData}
        />

        <PropertyDetailsSection
          formData={formData}
          setFormData={setFormData}
          handleRadioChange={handleRadioChange}
          handleChange={handleChange}
          handleAreaValueChange={handleAreaValueChange}
          handleAreaUnitChange={handleAreaUnitChange}
          availableFrom={availableFrom}
          handleDateChange={handleDateChange}
          handleCheckboxChange={handleCheckboxChange}
        />
        
        {/* Amenities Section */}
        <div className="form-section">
          <h3 className="section-title">Amenities</h3>
          <fieldset>
            <div className="checkbox-container">
              {amenitiesList.map((amenity) => (
                <label 
                  key={amenity} 
                  className={`checkbox-label ${selectedAmenities.includes(amenity) ? "selected" : ""}`}
                >
                  <input
                    type="checkbox"
                    value={amenity}
                    checked={selectedAmenities.includes(amenity)}
                    onChange={() => handleAmenityChange(amenity)}
                  />
                  {amenity}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {/* Facilities Section */}
        <div className="form-section">
          <h3 className="section-title">Facilities</h3>
          <fieldset>
            <div className="checkbox-container">
              {facilitiesList.map((facility) => (
                <label 
                  key={facility} 
                  className={`checkbox-label ${selectedFacilities.includes(facility) ? "selected" : ""}`}
                >
                  <input
                    type="checkbox"
                    value={facility}
                    checked={selectedFacilities.includes(facility)}
                    onChange={() => handleFacilityChange(facility)}
                  />
                  {facility}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {/* Security Section */}
        <div className="form-section">
          <h3 className="section-title">Security</h3>
          <fieldset>
            <div className="checkbox-container">
              {securityList.map((security) => (
                <label 
                  key={security} 
                  className={`checkbox-label ${selectedSecurity.includes(security) ? "selected" : ""}`}
                >
                  <input
                    type="checkbox"
                    value={security}
                    checked={selectedSecurity.includes(security)}
                    onChange={() => handleSecurityChange(security)}
                  />
                  {security}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

    <div>
      <h2>Add Property Media</h2>
      <MediaUploadTabs mediaData={mediaData} setMediaData={setMediaData} />
    </div>

        {/* Form Buttons */}
        <div className="form-buttons">
          <button 
            className="submit-button" 
            type="submit" 
            disabled={isAdding || isUpdating}
          >
            {isAdding || isUpdating 
              ? (isAdding ? 'Submitting...' : 'Updating...') 
              : (editingId ? 'Update Property' : 'Add Property')}
          </button>
          {editingId && (
            <button 
              type="button" 
              className="cancel-button"
              onClick={handleCancelEdit}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default SellPropertyForm;