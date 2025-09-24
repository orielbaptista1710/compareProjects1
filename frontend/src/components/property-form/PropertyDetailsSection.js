import React from 'react';
import { InputNumber, Select, DatePicker } from 'antd';
import dayjs from 'dayjs';
// import "react-datepicker/dist/react-datepicker.css";
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
  PARKING_OPTIONS,
  // PROPERTY_GROUPS
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

  React.useEffect(() => {
    console.log("Form Data:", formData);
  }, [formData]);

  // Area units
  const AREA_UNITS = [
    { value: 'sqft', label: 'Square Feet' },
    { value: 'sqmts', label: 'Square Meters' },
    { value: 'guntas', label: 'Guntas' },
    { value: 'hectares', label: 'Hectares' },
    { value: 'acres', label: 'Acres' }
  ];

  const typeToGroupMap = {
  "Flats/Apartments": "Residential",
  "Villa": "Residential",
  "Plot": "Residential",
  "Shop/Showroom": "Commercial",
  "Retail": "Commercial",
  "Industrial Warehouse": "Commercial"
};

  const RadioGroup = ({ name, options, value, onChange, withSuffix }) => (
  <div className="radio-container">
    {options.map((opt) => {
      const optionValue = typeof opt === "string" ? opt : opt.value;
      const optionLabel = typeof opt === "string" ? opt : opt.label;

      return (
        <label 
          key={optionValue} 
          className={`radio-label ${value === optionValue ? "selected" : ""}`}
        >
          <input
            type="radio"
            name={name}
            value={optionValue}
            checked={value === optionValue}
            onChange={onChange}
          />
          {optionLabel} {withSuffix ? withSuffix : ""}
        </label>
      );
    })}
  </div>
);



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
          <RadioGroup
            name="ageOfProperty"
            options={AGE_OF_PROPERTY_OPTIONS}
            value={formData.ageOfProperty || ''}
            onChange={handleRadioChange}
          />
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
          <RadioGroup
            name="floor"
            options={FLOOR_OPTIONS}
            value={formData.floor || ''}
            onChange={handleRadioChange}
          />
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
              value={availableFrom ? dayjs(availableFrom) : null}
              onChange={(date) => handleDateChange(date ? date.toDate() : null)}
              format="DD/MM/YYYY"
              placeholder="Select date"
            />
          </div>
        </div>

        {/* Property Group */}
      {/* <fieldset>
        <legend>Property Group</legend>
        <RadioGroup
          name="propertyGroup"
          options={PROPERTY_GROUPS}
          value={formData.propertyGroup}
          onChange={handleRadioChange}
        />
      </fieldset> */}

      {/* Property Type */}
      <fieldset>
  <legend>Property Type</legend>
  <div className="property-type-container">
    {PROPERTY_TYPES.map((type) => (
      <div
        key={type.label}
        className={`property-type-card ${formData.propertyType === type.label ? "selected" : ""}`}
        onClick={() => {
          setFormData(prev => ({ 
            ...prev, 
            propertyType: type.label,
            propertyGroup: typeToGroupMap[type.label] 
          }));
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
          <RadioGroup
            name="furnishing"
            options={FURNISHED_OPTIONS}
            value={formData.furnishing}
            onChange={handleRadioChange}
            withSuffix={""}
          />
        </fieldset>

        {/* Possession Status */}
        <fieldset>
          <legend>Possession Status</legend>
          <RadioGroup
            name="possessionStatus"
            options={POSSESSION_STATUS_OPTIONS}
            value={formData.possessionStatus}
            onChange={handleRadioChange}
            withSuffix={""} // No suffix needed for possession status
          />
        </fieldset>

        {/* BHK Configuration */}
        <fieldset>
          <legend>BHK Configuration</legend>
          <RadioGroup
            name="bhk"
            options={BHK_OPTIONS}
            value={formData.bhk}
            onChange={handleRadioChange}
            withSuffix="BHK"
          />
        </fieldset>


        {/* Number of Bathrooms */}
        <fieldset>
          <legend>Number of Bathrooms</legend>
          <RadioGroup
           name="bathrooms"
           options={BATHROOM_OPTIONS}
           value={formData.bathrooms}
           onChange={handleRadioChange}
           withSuffix="Bathroom"
         />
        </fieldset>

        {/* Number of Balconies */}
        <fieldset>
          <legend>Number of Balconies</legend>
          <RadioGroup
            name="balconies"
            options={BALCONY_OPTIONS}
            value={formData.balconies}
            onChange={handleRadioChange}
            withSuffix="Balcony"
          />
        </fieldset>

        {/* Facing */}
        <fieldset>
          <legend>Facing</legend>
          <RadioGroup
            name="facing"
            options={FACING_OPTIONS}
            value={formData.facing}
            onChange={handleRadioChange}
            withSuffix={""}
          />
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