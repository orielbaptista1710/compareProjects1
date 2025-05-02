import React, { useEffect, useState } from 'react';
import './MoreFiltersPanel.css';
import axios from 'axios';

// Define your desired order for each filter type
const POSSESSION_STATUS_ORDER = [
  'Ready To Move',
  'Under Construction',
  'New Launch'
];

const FURNISHING_ORDER = [
  'Fully Furnished',
  'Semi Furnished',
  'Unfurnished'
];

const FACING_ORDER = [
  'North',
  'South',
  'East',
  'West',
  'North-East',
  'North-West',
  'South-East',
  'South-West'
];

const FLOOR_ORDER = [
  'Ground',
  '1',
  '2',
  '3',
  '4',
  '5+'
];

const AGE_ORDER = [
  "New", "1-5 years", "5-10 years", "10+ years"];

const BATHROOMS_ORDER=[
  "1", "2", "3", "4", "5+"
];

const BALCONIES_ORDER=[
  "0","1", "2", "3", "4", "5+"
];



function MoreFiltersPanel({ 
  isOpen, 
  onClose,
  selectedPossessionStatus,
  setSelectedPossessionStatus,
  selectedFurnishings,
  setSelectedFurnishings,
  selectedFacing,
  setSelectedFacing,
  selectedFloors,
  setSelectedFloors,
  selectedAge,
  setSelectedAge,
  selectedBathrooms,
  setSelectedBathrooms,
  selectedBalconies,
  setSelectedBalconies,
}) {
  const [filterOptions, setFilterOptions] = useState({
    possessionStatusOptions: [],
    furnishingOptions: [],
    facingOptions: [],
    floorOptions: [],
    ageOptions: [],
    bathroomOptions: [],
    balconyOptions: [],
  });

  // Function to sort options according to our predefined order
  const sortOptions = (options, order) => {
    return [...options].sort((a, b) => {
      const indexA = order.indexOf(a);
      const indexB = order.indexOf(b);
      
      // If both items are in our order array, sort them accordingly
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      
      // If only one item is in our order array, it comes first
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      // If neither item is in our order array, sort alphabetically
      return a.localeCompare(b);
    });
  };

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/properties/filters");
        
        // Sort the options according to our predefined order
        setFilterOptions({
          possessionStatusOptions: sortOptions(response.data?.possessionStatusOptions || [], POSSESSION_STATUS_ORDER),
          furnishingOptions: sortOptions(response.data?.furnishingOptions || [], FURNISHING_ORDER),
          facingOptions: sortOptions(response.data?.facingOptions || [], FACING_ORDER),
          floorOptions: sortOptions(response.data?.floorOptions || [], FLOOR_ORDER),
          ageOptions: sortOptions(response.data?.ageOptions || [], AGE_ORDER),
          bathroomOptions: sortOptions(response.data?.bathroomOptions || [], BATHROOMS_ORDER),
          balconyOptions: sortOptions(response.data?.balconyOptions || [], BALCONIES_ORDER),
        });
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    };

    if (isOpen) {
      fetchFilterOptions();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleSelection = (array, value, setter) => {
    if (array.includes(value)) {
      setter(array.filter(item => item !== value));
    } else {
      setter([...array, value]);
    }
  };

  const clearAllFilters = () => {
    setSelectedPossessionStatus([]);
    setSelectedFurnishings([]);
    setSelectedFacing([]);
    setSelectedFloors([]);
    setSelectedAge([]);
    setSelectedBathrooms([]);
    setSelectedBalconies([]);
  };

  const {
    possessionStatusOptions,
    furnishingOptions,
    facingOptions,
    floorOptions,
    ageOptions,
    bathroomOptions,
    balconyOptions,
  } = filterOptions;

  return (
    <div className="more-filters-panel-overlay">
      <div className="more-filters-panel">
        <div className="panel-header">
          <h3>More Filters</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="panel-content">

          {/* Possession Status */}
          <div className="filter-section">
            <h4>Possession Status</h4>
            <div className="option-group">
              {possessionStatusOptions.map(option => (
                <button
                  key={option}
                  className={`option-btn ${selectedPossessionStatus.includes(option) ? 'selected' : ''}`}
                  onClick={() => toggleSelection(selectedPossessionStatus, option, setSelectedPossessionStatus)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Furnishing */}
          <div className="filter-section">
            <h4>Furnishing</h4>
            <div className="option-group">
              {furnishingOptions.map(option => (
                <button
                  key={option}
                  className={`option-btn ${selectedFurnishings.includes(option) ? 'selected' : ''}`}
                  onClick={() => toggleSelection(selectedFurnishings, option, setSelectedFurnishings)}
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
                  className={`option-btn ${selectedFacing.includes(option) ? 'selected' : ''}`}
                  onClick={() => toggleSelection(selectedFacing, option, setSelectedFacing)}
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
                  className={`option-btn ${selectedFloors.includes(option) ? 'selected' : ''}`}
                  onClick={() => toggleSelection(selectedFloors, option, setSelectedFloors)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Age */}
          <div className="filter-section">
            <h4>Age</h4>
            <div className="option-group">
              {ageOptions.map(option =>(
                <button
                  key={option}
                  className={`option-btn ${selectedAge.includes(option) ? 'selected' : ''}`}
                  onClick={() => toggleSelection(selectedAge, option, setSelectedAge)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Bathrooms */}
          <div className="filter-section">
            <h4>Bathrooms</h4>
            <div className="option-group">
              {bathroomOptions.map(option => (
                <button
                  key={option}
                  className={`option-btn ${selectedBathrooms.includes(option) ? 'selected' : ''}`}
                  onClick={() => toggleSelection(selectedBathrooms, option, setSelectedBathrooms)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Balconies */}
          <div className="filter-section">
            <h4>Balconies</h4>
            <div className="option-group">
              {balconyOptions.map(option => (
                <button
                  key={option}
                  className={`option-btn ${selectedBalconies.includes(option) ? 'selected' : ''}`}
                  onClick={() => toggleSelection(selectedBalconies, option, setSelectedBalconies)}
                >
                  {option}
                </button>
              ))
              }
            </div>
          </div>

        </div>

        <div className="panel-footer">
          <button className="clear-btn" onClick={clearAllFilters}>Clear All</button>
          <button className="apply-btn" onClick={onClose}>View Properties</button>
        </div>
      </div>
    </div>
  );
}

export default MoreFiltersPanel;
