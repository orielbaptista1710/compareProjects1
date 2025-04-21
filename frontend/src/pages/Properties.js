import React, { useState, useEffect } from 'react';
import PropertyCard from '../components/PropertyCard';
import './Properties.css';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CompareSidebar from '../components/CompareSidebar';
import Select from 'react-select'; // You'll need to install react-select
import MoreFiltersPanel from '../components/MoreFiltersPanel';

function Properties({ addToCompare, compareList, removeFromCompare }) {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOption, setSortOption] = useState('Relevance');
  const [isMoreFiltersOpen, setMoreFiltersOpen] = useState(false);
  
  // Filters - modified to handle arrays for multi-select
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState([]);
  const [selectedBhkTypes, setSelectedBhkTypes] = useState([]);
  const [budgetRange, setBudgetRange] = useState({
    min: '',
    max: ''
  });
  const [selectedAreaRange, setSelectedAreaRange] = useState('');
  const [selectedFurnishings, setSelectedFurnishings] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedLocality, setSelectedLocality] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const response = await axios.get("http://localhost:5000/api/properties");
        if (response.status === 200) {
          setProperties(response.data);
          setFilteredProperties(response.data);
        } else {
          throw new Error("Failed to fetch properties");
        }
      } catch (err) {
        console.error("Error fetching properties:", err);
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchProperties();
  }, []);

  useEffect(() => {
      const type = query.get('type');
      const budget = query.get('budget');
      const city = query.get('city');
      const locality = query.get('locality');

      if (type) setSelectedPropertyTypes([type]);
      if(city) setSelectedCity(city);
      if(locality) setSelectedLocality(locality);
      if (budget) {
        setBudgetRange({
          min: '',
          max: budget
        });
      }
    }, [location.search]);

  useEffect(() => {
    if (!properties.length) return;

    const filtered = properties.filter(property => {
        // For multi-select filters, check if property matches any of the selected values
        const matchesPropertyType = selectedPropertyTypes.length === 0 || 
          (property.propertyType && 
           selectedPropertyTypes.some(type => 
             property.propertyType.toLowerCase() === type.toLowerCase()
           ));
        
        const matchesBhk = selectedBhkTypes.length === 0 || 
          (property.bhk && 
           selectedBhkTypes.some(bhk => 
             String(property.bhk) === String(bhk)
           ));
        
        const matchesFurnishing = selectedFurnishings.length === 0 || 
          (property.furnishing !== undefined && 
           property.furnishing !== null &&
           selectedFurnishings.some(furnishing => 
             String(property.furnishing).toLowerCase() === String(furnishing).toLowerCase()
           ));

        const matchesState = !selectedState || 
          (property.state && property.state.toLowerCase() === selectedState.toLowerCase());
        
        const matchesCity = !selectedCity || 
          (property.city && property.city.toLowerCase() === selectedCity.toLowerCase());
        
        const matchesLocality = !selectedLocality || 
          (property.locality && property.locality.toLowerCase() === selectedLocality.toLowerCase());
        
        const matchesSearch = !searchTerm || 
          (property.title && property.title.toLowerCase().includes(searchTerm.toLowerCase())) || 
          (property.description && property.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (property.locality && property.locality.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (property.city && property.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (property.propertyType && property.propertyType.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (property.bhk && String(property.bhk).toLowerCase().includes(searchTerm.toLowerCase()))

        const matchesBudget = !budgetRange.max || 
          (property.price && property.price <= parseInt(budgetRange.max));

      return (
        matchesPropertyType &&
        matchesBhk &&
        matchesFurnishing &&
        matchesState &&
        matchesCity &&
        matchesLocality &&
        matchesSearch &&
        matchesBudget
      );
    });

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch(sortOption) {
        case 'Price: Low to High': return (a.price || 0) - (b.price || 0);
        case 'Price: High to Low': return (b.price || 0) - (a.price || 0);
        case 'Newest First': return new Date(b.createdAt) - new Date(a.createdAt);
        default: return 0;
      }
    });

    setFilteredProperties(sorted);
}, [
  properties,
  selectedPropertyTypes,
  selectedBhkTypes,
  selectedFurnishings,
  selectedState,
  selectedCity,
  selectedLocality,
  searchTerm,
  sortOption,
  budgetRange
]);

  // Extract unique values for filters
  const states = [...new Set(properties.map(p => p.state))];
  const propertyTypes = [...new Set(properties.map(p => p.propertyType))];
  const bhkTypes = [...new Set(properties.map(p => p.bhk))];
  const cities = [...new Set(properties.map(p => p.city))];
  const localities = [...new Set(properties.map(p => p.locality))];
  const furnishingTypes = [...new Set(properties.map(p => p.furnishing).filter(Boolean))];
  
  // Prepare options for react-select components
  const propertyTypeOptions = propertyTypes.map(type => ({ value: type, label: type }));
  const bhkTypeOptions = bhkTypes.map(bhk => ({ value: bhk, label: `${bhk} BHK` }));
  const furnishingOptions = furnishingTypes.map(type => ({ value: type, label: type }));

  // Filter cities based on selected state
  const filteredCities = selectedState
    ? [...new Set(properties
        .filter(p => p.state === selectedState)
        .map(p => p.city))]
    : cities;
  
  // Filter localities based on selected city (updated to work with state filter)
  const filteredLocalities = selectedCity
    ? [...new Set(properties
        .filter(p => p.city === selectedCity)
        .map(p => p.locality))]
    : localities;

  if (loading) return <div className="loading">Loading Properties...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="properties-page">
    
      <div className="filters-container">
        <div className="filter-group">
          <label>State</label>
          <select
            value={selectedState}
            onChange={(e) => {
              setSelectedState(e.target.value);
              setSelectedCity(''); // Reset city when state changes
              setSelectedLocality(''); // Reset locality when state changes
            }}
          >
            <option value="">All States</option>
            {states.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>City</label>
          <select
            value={selectedCity}
            onChange={(e) => {
              setSelectedCity(e.target.value);
              setSelectedLocality(''); // Reset locality when city changes
            }}
            disabled={!selectedState} // Disable until state is selected
          >
            <option value="">All Cities</option>
            {filteredCities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Locality</label>
          <select
            value={selectedLocality}
            onChange={(e) => setSelectedLocality(e.target.value)}
            disabled={!selectedCity} // Disable until city is selected
          >
            <option value="">All Localities</option>
            {filteredLocalities.map(locality => (
              <option key={locality} value={locality}>{locality}</option>
            ))}
          </select>
        </div>

        {/* Multi-select Property Type Filter */}
        <div className="filter-group">
          <label>Property Type</label>
          <Select
            isMulti
            options={propertyTypeOptions}
            value={selectedPropertyTypes.map(type => ({ value: type, label: type }))}
            onChange={(selectedOptions) => 
              setSelectedPropertyTypes(selectedOptions.map(option => option.value))
            }
            className="multi-select"
            classNamePrefix="select"
            placeholder="Select types..."
          />
        </div>

        {/* Multi-select BHK Type Filter */}
        <div className="filter-group">
          <label>BHK Type</label>
          <Select
            isMulti
            options={bhkTypeOptions}
            value={selectedBhkTypes.map(bhk => ({ value: bhk, label: `${bhk} BHK` }))}
            onChange={(selectedOptions) => 
              setSelectedBhkTypes(selectedOptions.map(option => option.value))
            }
            className="multi-select"
            classNamePrefix="select"
            placeholder="Select BHK..."
          />
        </div>

        {/* Multi-select Furnishing Filter */}
        {furnishingTypes.length > 0 && (
          <div className="filter-group">
            <label>Furnishing</label>
            <Select
              isMulti
              options={furnishingOptions}
              value={selectedFurnishings.map(furnishing => ({ value: furnishing, label: furnishing }))}
              onChange={(selectedOptions) => 
                setSelectedFurnishings(selectedOptions.map(option => option.value))
              }
              className="multi-select"
              classNamePrefix="select"
              placeholder="Select furnishings..."
            />
          </div>
        )}


<button 
  className="more-filters-btn" 
  onClick={() => setMoreFiltersOpen(true)}
>
  More Filters
</button>
      </div>

      <div className="filter-group search-group" style={{
  flexGrow: 1,
  marginLeft: 'auto' // Aligns to the right if space is available
}}>
  <label style={{
    fontSize: '12px',
    color: '#666',
    marginBottom: '5px',
    fontWeight: '500',
    display: 'block'
  }}>Search</label>
  <input 
    type="text" 
    placeholder="Search by locality, title, description" 
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    style={{
      padding: '8px 12px',
      border: '1px solid #e0e0e0',
      borderRadius: '4px',
      fontSize: '14px',
      width: '100%',
      height: '36px',
      boxSizing: 'border-box',
      transition: 'border-color 0.2s',
      backgroundColor: 'white'
    }}
    onFocus={(e) => {
      e.target.style.borderColor = '#4a90e2';
      e.target.style.outline = 'none';
    }}
    onBlur={(e) => {
      e.target.style.borderColor = '#e0e0e0';
    }}
  />
</div>

<MoreFiltersPanel
  isOpen={isMoreFiltersOpen}
  onClose={() => setMoreFiltersOpen(false)}
  budgetRange={budgetRange}
  setBudgetRange={setBudgetRange}
  selectedFurnishings={selectedFurnishings}
  setSelectedFurnishings={setSelectedFurnishings}
  selectedPropertyTypes={selectedPropertyTypes}
  setSelectedPropertyTypes={setSelectedPropertyTypes}
/>


      <div className="header-section">
        <div className="last-updated">
          Last Updated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div> 

        <div className="main-header">
          <h1>Available Properties</h1>
          
          <div className="sort-options">
            <span>Sort by:</span>
            <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
              <option value="Relevance">Relevance</option>
              <option value="Price: Low to High">Price: Low to High</option>
              <option value="Price: High to Low">Price: High to Low</option>
              <option value="Newest First">Newest First</option>
            </select>
          </div>
        </div>
        
        <div className="results-count">
          Showing 1-{Math.min(30, filteredProperties.length)} of {filteredProperties.length} properties
        </div> 
      </div>

      <div className='main-content'>


      <div className='main-content'>
        <div className="property-listings">
          {filteredProperties.length > 0 ? (
            filteredProperties.slice(0, 30).map(property => (
              <PropertyCard 
                key={property._id} 
                property={property} 
                addToCompare={addToCompare}
              />
            ))
          ) : (
            <div className="no-results">
              No properties match your filters. Try adjusting your search criteria.
            </div>
          )}
        </div>

        <div className="ad-container">
          <h3>Advertisement</h3>
          <div className="ad-content">
            <p>This is a dummy vertical ad.</p>
            <p>Ad content goes here.</p>
          </div>
        </div>
      </div>

    </div>


      {compareList.length > 0 && (
        <CompareSidebar 
          compareList={compareList} 
          removeFromCompare={removeFromCompare}
        />
      )}
    </div>
  );
}

export default Properties;