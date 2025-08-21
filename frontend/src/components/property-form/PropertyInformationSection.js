const PropertyInformationSection = ({ formData, handleChange }) => (
  <section aria-labelledby="property-section">
    <h3 id="property-section" className="section-title">Property Information</h3>
    <div className="form-row">
            <div className="form-col">
            <label htmlFor="firstName">Developer Name</label>
            <input
              id="firstName"
              className="form-input"
              name="firstName"
              placeholder="Your first name"
              value={formData.firstName || ''}
              onChange={handleChange}
              required
            />
      </div>
    </div>
    <div className="form-row">
      <div className="form-col">
        <label htmlFor="title">Title</label>
        <input
          id="title"
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
              <label htmlFor="description">Short Description</label>
              <textarea
                id="description"
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
              <label htmlFor="long_description">Detailed Description</label>
              <textarea
                id="long_description"
                className="form-input"
                name="long_description"
                placeholder="Detailed description"
                value={formData.long_description || ''}
                onChange={handleChange}
                rows={5}
              />
            </div>
          </div>
  </section>
);

export default PropertyInformationSection;