import { useState, useEffect } from 'react';
import { FaHome, FaBuilding, FaWarehouse, FaStore, FaMap } from "react-icons/fa";
import './SellPropertyForm.css';
import locationData from '../database/locationData';
import { Form, Input, Button, Select, InputNumber } from 'antd';

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
  const [form] = Form.useForm();

  // Property type options
  const propertyTypes = [
    { label: "Residential", icon: <FaHome /> },
    { label: "Industrial", icon: <FaWarehouse /> },
    { label: "Retail", icon: <FaStore /> },
    { label: "Commercial", icon: <FaBuilding /> },
    { label: "Plot", icon: <FaMap /> },
  ];

  // Furnishing options
  const furnishedList = ["Furnished", "Semi Furnished", "Unfurnished", "Fully Furnished"];
  
  // Possession status options
  const possessionStatusList = [
    "Under Construction", 
    "Ready to Move",
    "Ready for Development", 
    "Possession Within 3 Months", 
    "Possession Within 6 Months", 
    "Possession Within 1 Year", 
    "Ready for Sale"
  ];

  const bhkOptions = ["1", "2", "3", "4", "5+"];
  const bathroomOptions = ["1", "2", "3", "4", "5+"];
  const balconyOptions = ["0", "1", "2", "3", "4+"];
  const facingOptions = ["East", "West", "North", "South", "North-East", "North-West", "South-East", "South-West"];
  const parkingOptions = ["Available", "Not Available", "2 Wheeler", "4 Wheeler", "2 Parking Slots", "No Parking",
                          "Disabled", "Basement Parking","Disabled Access Parking", "Visitor Parking"];

  // State variables
  const [selectedState, setSelectedState] = useState(formData.state || '');
  const [selectedCity, setSelectedCity] = useState(formData.city || '');
  const [landmarkInput, setLandmarkInput] = useState('');
  const [landmarks, setLandmarks] = useState(Array.isArray(formData.landmarks) ? formData.landmarks : []);

  // Sync state with formData changes (important for editing)
  useEffect(() => {
    setSelectedState(formData.state || '');
    setSelectedCity(formData.city || '');
    setLandmarks(Array.isArray(formData.landmarks) ? formData.landmarks : []);
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

  const handleLandmarkChange = (e) => {
    setLandmarkInput(e.target.value);
  };
  
  const handleLandmarkKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = landmarkInput.trim();
      if (newTag && !landmarks.includes(newTag)) {
        const updatedLandmarks = [...landmarks, newTag];
        setLandmarks(updatedLandmarks);
        setFormData(prev => ({ ...prev, landmarks: updatedLandmarks }));
        setLandmarkInput('');
      }
    }
  };
  
  const removeLandmark = (index) => {
    const updatedLandmarks = [...landmarks];
    updatedLandmarks.splice(index, 1);
    setLandmarks(updatedLandmarks);
    setFormData(prev => ({ ...prev, landmarks: updatedLandmarks }));
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

  const handleRadioChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      landmarks: landmarks,
      parkings: Array.isArray(formData.parkings) ? formData.parkings : [formData.parkings].filter(Boolean)
    });
  };

  return (
    <div className="form-container">
      <h2 className="form-title">
        {editingId ? 'Edit Property' : 'Add Property'}
      </h2>

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      <form className="form-group" onSubmit={handleSubmit}>
        <h3 className="section-title">Contact Information</h3>
        <div className="form-row">
          <div className="form-col">
            <label>Developer Name</label>
            <input
              className="form-input"
              name="firstName"
              placeholder="Your first name"
              value={formData.firstName || ''}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <h3 className="section-title">Property Information</h3>
        <div className="form-row">
          <div className="form-col">
            <label>Title</label>
            <input
              className="form-input"
              name="title"
              placeholder="Property title"
              value={formData.title || ''}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-col">
            <label>Short Description</label>
            <textarea
              className="form-input"
              name="description"
              placeholder="Brief description"
              value={formData.description || ''}
              onChange={handleChange}
              required
              rows={3}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-col">
            <label>Detailed Description</label>
            <textarea
              className="form-input"
              name="long_description"
              placeholder="Detailed description"
              value={formData.long_description || ''}
              onChange={handleChange}
              rows={5}
            />
          </div>
        </div>

        <h3 className="section-title">Location Details</h3>
        <div className="location-details">
          <div className="form-row">
            <div className="form-col">
              <label>Location</label>
              <input
                className="form-input"
                name="location"
                placeholder="General location/area"
                value={formData.location || ''}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <label>State</label>
              <select
                className="form-input"
                name="state"
                value={formData.state || ''}
                onChange={handleStateChange}
                required
              >
                <option value="">Select State</option>
                {Object.keys(locationData).map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-col">
              <label>City</label>
              <select
                className="form-input"
                name="city"
                value={formData.city || ''}
                onChange={handleCityChange}
                required
                disabled={!selectedState}
              >
                <option value="">Select City</option>
                {selectedState &&
                  Object.keys(locationData[selectedState]).map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <label>Locality</label>
              <select
                className="form-input"
                name="locality"
                value={formData.locality || ''}
                onChange={handleLocalityChange}
                required
                disabled={!selectedCity}
              >
                <option value="">Select Locality</option>
                {selectedState &&
                  selectedCity &&
                  locationData[selectedState][selectedCity].map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-col">
              <label>Pincode</label>
              <input
                className="form-input"
                name="pincode"
                type="number"
                placeholder="Pincode"
                value={formData.pincode || ''}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <label>Full Address</label>
              <textarea
                className="form-input"
                name="address"
                placeholder="Complete property address"
                value={formData.address || ''}
                onChange={handleChange}
                required
                rows={3}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <label>Nearby Landmarks</label>
              <div className="tag-input-wrapper">
                <ul className="tags">
                  {landmarks.map((tag, index) => (
                    <li key={index} className="tag">
                      {tag}
                      <span className="tag-close" onClick={() => removeLandmark(index)}>
                        &times;
                      </span>
                    </li>
                  ))}
                </ul>
                <input
                  type="text"
                  className="form-input tag-input"
                  placeholder="Type a landmark and press Enter"
                  value={landmarkInput}
                  onChange={handleLandmarkChange}
                  onKeyDown={handleLandmarkKeyDown}
                />
              </div>
            </div>
          </div>
        </div>

        <Form.Item label="Total Price (₹)" name="price">
          <InputNumber 
            style={{ width: '100%' }}
            formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => value.replace(/₹\s?|(,*)/g, '')}
            min={0}
            value={formData.price || 0}
            onChange={(value) => setFormData({...formData, price: value})}
          />
        </Form.Item>

        <fieldset>
          <legend>Age of Property</legend>
          <div className="radio-container">
            {["New", "1-5 years", "5-10 years", "10+ years"].map(option => (
              <label 
                key={option} 
                className={`radio-label ${formData.ageOfProperty === option ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="ageOfProperty"
                  value={option}
                  checked={formData.ageOfProperty === option}
                  onChange={handleRadioChange}
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="form-row">
          <div className="form-col">
            <label>Total Floors in Building</label>
            <input
              className="form-input"
              name="totalFloors"
              type="number"
              min="1"
              placeholder="Total floors"
              value={formData.totalFloors || ''}
              onChange={handleChange}
            />
          </div>
        </div>

        <fieldset>
          <legend>Floor Number</legend>
          <div className="radio-container">
            {["Ground", "1", "2", "3", "4", "5+"].map(option => (
              <label 
                key={option} 
                className={`radio-label ${formData.floor === option ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="floor"
                  value={option}
                  checked={formData.floor === option}
                  onChange={handleRadioChange}
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Property Type</legend>
          <div className="property-type-container">
            {propertyTypes.map((type) => (
              <div
                key={type.label}
                className={`property-type-card ${formData.propertyType === type.label ? "selected" : ""}`}
                onClick={() => {
                  setFormData(prev => ({ ...prev, propertyType: type.label }));
                }}
              >
                {type.icon}
                <span>{type.label}</span>
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Furnishings</legend>
          <div className="radio-container">
            {furnishedList.map((furnished) => (
              <label 
                key={furnished} 
                className={`radio-label ${formData.furnishing === furnished ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="furnishing"
                  value={furnished}
                  checked={formData.furnishing === furnished}
                  onChange={handleRadioChange}
                />
                {furnished}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Possession Status</legend>
          <div className="radio-container">
            {possessionStatusList.map((status) => (
              <label 
                key={status} 
                className={`radio-label ${formData.possessionStatus === status ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="possessionStatus"
                  value={status}
                  checked={formData.possessionStatus === status}
                  onChange={handleRadioChange}
                />
                {status}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>BHK Configuration</legend>
          <div className="radio-container">
            {bhkOptions.map(option => (
              <label 
                key={option} 
                className={`radio-label ${formData.bhk === option ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="bhk"
                  value={option}
                  checked={formData.bhk === option}
                  onChange={handleRadioChange}
                />
                {option} BHK
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Number of Bathrooms</legend>
          <div className="radio-container">
            {bathroomOptions.map(options => (
              <label 
                key={options} 
                className={`radio-label ${formData.bathrooms === options ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="bathrooms"
                  value={options}
                  checked={formData.bathrooms === options}
                  onChange={handleRadioChange}
                />
                {options}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Number of Balconies</legend>
          <div className="radio-container">
            {balconyOptions.map(option =>(
              <label
                key={option}
                className={`radio-label ${formData.balconies === option ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="balconies"
                  value={option}
                  checked={formData.balconies === option}
                  onChange={handleRadioChange}
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Facing</legend>
          <div className="radio-container">
            {facingOptions.map(option =>(
              <label
                key={option}
                className={`radio-label ${formData.facing === option ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="facing"
                  value={option}
                  checked={formData.facing === option}
                  onChange={handleRadioChange}
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Parking Availability</legend>
          <div className="radio-container">
            {parkingOptions.map(option => (
              <label
                key={option}
                className={`checkbox-label ${(formData.parkings || []).includes(option) ? "selected" : ""}`}
              >
                <input
                  type="checkbox"
                  name="parkings"
                  value={option}
                  checked={(formData.parkings || []).includes(option)}
                  onChange={() => handleCheckboxChange('parkings', option)}
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="form-buttons">
          <button 
            className="submit-button" 
            type="submit" 
            disabled={isAdding || isUpdating || !formData.propertyType}
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