import React from 'react';
import './MoreFiltersPanel.css';

function MoreFiltersPanel({ 
  isOpen, 
  onClose,
  budgetRange = { min: '', max: '' }, // Default value if undefined
  setBudgetRange = () => {},
  selectedFurnishings = [],
  setSelectedFurnishings = () => {},
  selectedPropertyTypes = [],
  setSelectedPropertyTypes = () => {}
}) {
  if (!isOpen) return null;

  // Options for different filters
  const possessionStatusOptions = ['Ready To Move', 'Under Construction'];
  const subPropertyTypeOptions = [
    'Multistorey Apartment',
    'Builder Floor Apartment',
    'Penthouse',
    'Studio Apartment',
    'Residential House',
    'Villa'
  ];
  const saleTypeOptions = ['New', 'Resale'];
  const postedSinceOptions = ['All', 'Yesterday', 'Last Week', 'Last 2 Weeks'];
  const facingOptions = ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'];
  const floorOptions = ['Ground', '1', '2', '3', '4', '5+'];

  const toggleSelection = (array, value, setter) => {
    if (array.includes(value)) {
      setter(array.filter(item => item !== value));
    } else {
      setter([...array, value]);
    }
  };

  return (
    <div className="more-filters-panel-overlay">
      <div className="more-filters-panel">
        <div className="panel-header">
          <h3>More Filters</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        
        <div className="panel-content">
          {/* Covered Area Section */}
          <div className="filter-section">
            <h4>Covered Area (sq.ft)</h4>
            <div className="range-inputs">
              <input 
                type="number" 
                placeholder="Min" 
                value={budgetRange.min}
                onChange={(e) => setBudgetRange({...budgetRange, min: e.target.value})}
              />
              <span>to</span>
              <input 
                type="number" 
                placeholder="Max" 
                value={budgetRange.max}
                onChange={(e) => setBudgetRange({...budgetRange, max: e.target.value})}
              />
            </div>
          </div>

          {/* Possession Status */}
          <div className="filter-section">
            <h4>Possession Status</h4>
            <div className="option-group">
              {possessionStatusOptions.map(option => (
                <button 
                  key={option}
                  className={`option-btn ${selectedPropertyTypes.includes(option) ? 'selected' : ''}`}
                  onClick={() => toggleSelection(selectedPropertyTypes, option, setSelectedPropertyTypes)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Sub Property Type */}
          <div className="filter-section">
            <h4>Sub Property Type</h4>
            <div className="checkbox-group">
              {subPropertyTypeOptions.map(option => (
                <label key={option} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedPropertyTypes.includes(option)}
                    onChange={() => toggleSelection(selectedPropertyTypes, option, setSelectedPropertyTypes)}
                  />
                  <span className="checkmark"></span>
                  {option}
                </label>
              ))}
            </div>
          </div>

          {/* Sale Type */}
          <div className="filter-section">
            <h4>Sale Type</h4>
            <div className="option-group">
              {saleTypeOptions.map(option => (
                <button 
                  key={option}
                  className={`option-btn ${selectedPropertyTypes.includes(option) ? 'selected' : ''}`}
                  onClick={() => toggleSelection(selectedPropertyTypes, option, setSelectedPropertyTypes)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Posted Since */}
          <div className="filter-section">
            <h4>Posted Since</h4>
            <div className="option-group">
              {postedSinceOptions.map(option => (
                <button 
                  key={option}
                  className={`option-btn ${selectedPropertyTypes.includes(option) ? 'selected' : ''}`}
                  onClick={() => toggleSelection(selectedPropertyTypes, option, setSelectedPropertyTypes)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Facing */}
          <div className="filter-section">
            <h4>Facing</h4>
            <div className="option-group">
              {facingOptions.map(option => (
                <button 
                  key={option}
                  className={`option-btn ${selectedPropertyTypes.includes(option) ? 'selected' : ''}`}
                  onClick={() => toggleSelection(selectedPropertyTypes, option, setSelectedPropertyTypes)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Floor */}
          <div className="filter-section">
            <h4>Floor</h4>
            <div className="option-group">
              {floorOptions.map(option => (
                <button 
                  key={option}
                  className={`option-btn ${selectedPropertyTypes.includes(option) ? 'selected' : ''}`}
                  onClick={() => toggleSelection(selectedPropertyTypes, option, setSelectedPropertyTypes)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="panel-footer">
          <button className="clear-btn">Clear All</button>
          <button className="apply-btn" onClick={onClose}>
            View {Math.floor(Math.random() * 10000)} Properties
          </button>
        </div>
      </div>
    </div>
  );
}

export default MoreFiltersPanel;