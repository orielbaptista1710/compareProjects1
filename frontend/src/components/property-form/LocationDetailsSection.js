import locationData from "../../database/locationData";

const LocationDetailsSection = ({
  formData,
  selectedState, 
  selectedCity,
  handleStateChange,
  handleCityChange,
  handleLocalityChange,
  handleChange
}) => (
  <section aria-labelledby="location-section">
          <h3 id="location-section" className="section-title">Location Details</h3>
          <div className="location-details">
            <div className="form-row">
              <div className="form-col">
                <label htmlFor="state">State</label>
                <select
                  id="state"
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
                <label htmlFor="city">City</label>
                <select
                  id="city"
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
                <label htmlFor="locality">Locality</label>
                <select
                  id="locality"
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
                <label htmlFor="pincode">Pincode</label>
                <input
                  id="pincode"
                  className="form-input"
                  name="pincode"
                  type="number"
                  placeholder="Pincode"
                  value={formData.pincode || ''}
                  onChange={(e) => {
                    if (e.target.value.length <= 6 && /^\d*$/.test(e.target.value)) {
                      handleChange(e);
                    }
                  }}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-col">
                <label htmlFor="address">Full Address</label>
                <textarea
                  id="address"
                  className="form-input"
                  name="address"
                  placeholder="Complete property address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  required
                  rows={4}
                />
              </div>
            </div>

            <div className="form-row">
               <div className="form-col">
                 <label htmlFor="mapLink">Google Maps Link</label>
                 <input
                   id="mapLink"
                   className="form-input"
                   name="mapLink"
                   type="url"
                   pattern="https://.*"
                   placeholder="https://maps.google.com/..."
                   value={formData.mapLink || ''}
                   onChange={handleChange}
                 />
                 <small className="form-text">Paste the full Google Maps URL for this property</small>
               </div>
             </div>

            
          </div>
        </section>
);

export default LocationDetailsSection;