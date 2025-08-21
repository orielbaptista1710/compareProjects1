import React from 'react';
import { InputNumber, Select, DatePicker } from 'antd';
import "react-datepicker/dist/react-datepicker.css";
import {
  AGE_OF_PROPERTY_OPTIONS,
  FLOOR_OPTIONS,
  PROPERTY_TYPES,
  FURNISHED_OPTIONS,
  POSSESSION_STATUS_OPTIONS,
  BHK_OPTIONS,
  BATHROOM_OPTIONS,
  BALCONY_OPTIONS,
  FACING_OPTIONS,
  PARKING_OPTIONS
} from '../../constants/propertyFormConstants';

const PropertyDetailsSection = ({
  formData,
  setFormData,
  handleRadioChange,
  handleChange,
  handleAreaValueChange,
  handleAreaUnitChange,
  availableFrom,
  handleDateChange,
  handleCheckboxChange  
}) => {
  // Area units
  const AREA_UNITS = [
    { value: 'sqft', label: 'Square Feet' },
    { value: 'sqmts', label: 'Square Meters' },
    { value: 'guntas', label: 'Guntas' },
    { value: 'hectares', label: 'Hectares' },
    { value: 'acres', label: 'Acres' }
  ];

  return (
    <>
      {/* Pricing Section */}
      <section aria-labelledby="pricing-section">
        <h3 id="pricing-section" className="section-title">Property Details</h3>
        <div className="form-row">
          <div className="form-col">
            <label>Total Price (₹)</label>
            <InputNumber 
              style={{ width: '100%' }}
              formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/₹\s?|(,*)/g, '')}
              min={0}
              value={formData.price || 0}
              onChange={(value) => setFormData({...formData, price: value})}
            />
          </div>
        </div>

        {/* Price Negotiable Checkbox */}
        <div className="form-col">
          <label>
            <input
              type="checkbox"
              checked={formData.priceNegotiable || false}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                priceNegotiable: e.target.checked 
              }))}
            />
            Price Negotiable
          </label>
        </div>

        {/* RERA Approved Checkbox */}
        <div className="form-row">
          <div className="form-col">
            <label>
              <input
                type="checkbox"
                checked={formData.reraApproved || false}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  reraApproved: e.target.checked 
                }))}
              />
              RERA Approved
            </label>
          </div>

          <div className="form-col">
            <label htmlFor="reraNumber">RERA Number (Optional)</label>
            <input
              type="text"
              id="reraNumber"
              value={formData.reraNumber || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                reraNumber: e.target.value 
              }))}
              className="form-control"
              placeholder="Enter RERA Registration No."
              disabled={!formData.reraApproved}
            />
          </div>
        </div>

        {/* Age of Property */}
        <fieldset>
          <legend>Age of Property</legend>
          <div className="radio-container">
            {AGE_OF_PROPERTY_OPTIONS.map(option => (
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

        {/* Total Floors */}
        <div className="form-row">
          <div className="form-col">
            <label htmlFor="totalFloors">Total Floors in Building</label>
            <input
              id="totalFloors"
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

        {/* Floor Number */}
        <fieldset>
          <legend>Floor Number</legend>
          <div className="radio-container">
            {FLOOR_OPTIONS.map(option => (
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

        {/* Property Area */}
        <div className="form-row">
          <div className="form-col">
            <label>Property Area</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <InputNumber
                min={0}
                value={formData.area?.value ?? 0}
                onChange={handleAreaValueChange}
                style={{ flex: 2 }}
                placeholder="Enter area"
              />
              <Select
                value={formData.area?.unit ?? 'sqft'}
                onChange={handleAreaUnitChange}
                options={AREA_UNITS}
                style={{ flex: 1 }}
              />
            </div>
          </div>
        </div>

        {/* Units Available and Available From */}
        <div className="form-row">
          <div className="form-col">
            <label htmlFor="unitsAvailable">Units Available</label>
            <InputNumber
              id="unitsAvailable"
              min={1}
              max={1000}
              style={{ width: '100%' }}
              value={formData.unitsAvailable || 1}
              onChange={(value) => {
                const intValue = Math.floor(value);
                setFormData({...formData, unitsAvailable: intValue});
              }}
              parser={(value) => parseInt(value) || 1}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </div>

          <div className="form-col">
            <label htmlFor="availableFrom">Available From</label>
            <DatePicker
              selected={availableFrom}
              onChange={handleDateChange}
              dateFormat="dd/MM/yyyy"
              placeholderText="Select date"
              className="form-control"
              id="availableFrom"
            />
          </div>
        </div>

        {/* Property Type */}
        <fieldset>
          <legend>Property Type</legend>
          <div className="property-type-container">
            {PROPERTY_TYPES.map((type) => (
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

        {/* Furnishings */}
        <fieldset>
          <legend>Furnishings</legend>
          <div className="radio-container">
            {FURNISHED_OPTIONS.map((furnished) => (
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

        {/* Possession Status */}
        <fieldset>
          <legend>Possession Status</legend>
          <div className="radio-container">
            {POSSESSION_STATUS_OPTIONS.map((status) => (
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

        {/* BHK Configuration */}
        <fieldset>
          <legend>BHK Configuration</legend>
          <div className="radio-container">
            {BHK_OPTIONS.map(option => (
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

        {/* Number of Bathrooms */}
        <fieldset>
          <legend>Number of Bathrooms</legend>
          <div className="radio-container">
            {BATHROOM_OPTIONS.map(options => (
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

        {/* Number of Balconies */}
        <fieldset>
          <legend>Number of Balconies</legend>
          <div className="radio-container">
            {BALCONY_OPTIONS.map(option =>(
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

        {/* Facing */}
        <fieldset>
          <legend>Facing</legend>
          <div className="radio-container">
            {FACING_OPTIONS.map(option =>(
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

        {/* Parking Availability */}
        <fieldset>
          <legend>Parking Availability</legend>
          <div className="radio-container">
            {PARKING_OPTIONS.map(option => (
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
      </section>
    </>
  );
};

export default PropertyDetailsSection;