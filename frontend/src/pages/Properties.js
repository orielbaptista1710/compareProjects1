import React, { useState, useEffect } from 'react';
import PropertyCard from '../components/PropertyCard';
import './Properties.css';
import { useLocation} from 'react-router-dom';
import axios from 'axios';
import CompareSidebar from '../components/CompareSidebar';
import Select from 'react-select';
import MoreFiltersPanel from '../components/MoreFiltersPanel';
import { FiFilter, FiSearch } from 'react-icons/fi';
import BudgetFilter from '../components/BudgetFilter';

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
    min: '0',
    max: '1000000000'
  });
  //check for refresh here later
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedLocality, setSelectedLocality] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedPossessionStatus, setSelectedPossessionStatus] = useState([]);
  const [selectedFurnishings, setSelectedFurnishings] = useState([]);
  const [selectedFacing, setSelectedFacing] = useState([]);
  const [selectedFloors, setSelectedFloors] = useState([]);
  const [selectedAge, setSelectedAge] = useState([]);
  const [selectedBathrooms, setSelectedBathrooms] = useState([]);
  const [selectedBalconies, setSelectedBalconies] = useState([]);

  const location = useLocation();

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
    const query = new URLSearchParams(location.search); 
    
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

        const matchesState = !selectedState || 
          (property.state && property.state.toLowerCase() === selectedState.toLowerCase());
        
        const matchesCity = !selectedCity || 
          (property.city && property.city.toLowerCase() === selectedCity.toLowerCase());
        
        const matchesLocality = !selectedLocality || 
          (property.locality && property.locality.toLowerCase() === selectedLocality.toLowerCase());
        
        const matchesSearch = !searchTerm || 
          (property.title && property.title.toLowerCase().includes(searchTerm.toLowerCase())) || 
          (property.description && property.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (property.long_description && property.long_description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (property.locality && property.locality.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (property.city && property.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (property.propertyType && property.propertyType.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (property.bhk && String(property.bhk).toLowerCase().includes(searchTerm.toLowerCase()))

          const matchesBudget = (!budgetRange.max || 
            (property.price && property.price <= parseInt(budgetRange.max))) &&
            (!budgetRange.min || 
            (property.price && property.price >= parseInt(budgetRange.min)));

         // Add the new filter conditions
          const matchesPossessionStatus = selectedPossessionStatus.length === 0 || 
          (property.possessionStatus && 
           selectedPossessionStatus.some(status => 
             property.possessionStatus.includes(status)
           ));

          const matchesFurnishing = selectedFurnishings.length === 0 || 
          (property.furnishing && 
           selectedFurnishings.some(furnishing => 
             property.furnishing.includes(furnishing)
           ));

          const matchesFacing = selectedFacing.length === 0 || 
          (property.facing && 
           selectedFacing.some(facing => 
             property.facing === facing
           ));

          const matchesFloor = selectedFloors.length === 0 || 
            (property.floor && 
             selectedFloors.some(floor => 
               property.floor === floor
             ));
          
          const matchesAge = selectedAge.length === 0 ||
            (property.ageOfProperty &&
              selectedAge.some(age => {
                return property.ageOfProperty === age;
              })
            );
          
          const matchesBathrooms = selectedBathrooms.length === 0 ||
          (property.bathrooms &&
           selectedBathrooms.some(bathroom => {
             return property.bathrooms === bathroom;
           })
          )

          const matchesBalconies = selectedBalconies.length === 0 ||
          (property.balconies &&
           selectedBalconies.some(balcony => {
             return property.balconies === balcony;
           })
          )


          
   return (
        matchesPropertyType &&
        matchesBhk &&
        matchesState &&
        matchesCity &&
        matchesLocality &&
        matchesSearch &&
        matchesBudget &&
        matchesPossessionStatus &&
        matchesFurnishing &&
        matchesFacing &&
        matchesFloor &&
        matchesAge &&
        matchesBathrooms &&
        matchesBalconies
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
  selectedState,
  selectedCity,
  selectedLocality,
  searchTerm,
  sortOption,
  budgetRange,
  selectedPossessionStatus,
  selectedFurnishings,
  selectedFacing,
  selectedFloors,
  selectedAge,
  selectedBathrooms,
  selectedBalconies
]);

  // Extract unique values for filters
  const states = [...new Set(properties.map(p => p.state))];
  const propertyTypes = [...new Set(properties.map(p => p.propertyType))];
  const bhkTypes = [...new Set(properties.map(p => p.bhk))];
  const cities = [...new Set(properties.map(p => p.city))];
  const localities = [...new Set(properties.map(p => p.locality))];
  // const furnishingTypes = [...new Set(properties.map(p => p.furnishing).filter(Boolean))];
  
  // Prepare options for react-select components
  const propertyTypeOptions = propertyTypes.map(type => ({ value: type, label: type }));
  const bhkTypeOptions = bhkTypes.map(bhk => ({ value: bhk, label: `${bhk} BHK` }));
  // const furnishingOptions = furnishingTypes.map(type => ({ value: type, label: type }));

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

        <div className="filter-group">
        <label>Budget</label>
        <BudgetFilter
            budgetRange={budgetRange}
            setBudgetRange={setBudgetRange}
          />
        </div>

              <button className="more-filters-btn" onClick={() => setMoreFiltersOpen(true)}>
                <FiFilter /> More Filters
              </button>
      </div>

      <div className="search-container">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search properties..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <button className="search-button">
          <FiSearch size={20} />
        </button>
      </div>
      </div>

          <MoreFiltersPanel
            isOpen={isMoreFiltersOpen}
            onClose={() => setMoreFiltersOpen(false)}
            selectedPossessionStatus={selectedPossessionStatus}
            setSelectedPossessionStatus={setSelectedPossessionStatus}

            selectedFurnishings={selectedFurnishings}
            setSelectedFurnishings={setSelectedFurnishings}

            selectedFacing={selectedFacing}
            setSelectedFacing={setSelectedFacing}

            selectedFloors={selectedFloors}
            setSelectedFloors={setSelectedFloors}

            selectedAge={selectedAge}
            setSelectedAge={setSelectedAge}

            selectedBathrooms={selectedBathrooms}
            setSelectedBathrooms={setSelectedBathrooms}

            selectedBalconies={selectedBalconies}
            setSelectedBalconies={setSelectedBalconies}
          />
    
    <div className='main-page'>  

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
        
        <div className="ad-main-container">

        <div className="ad-container">
          <h3>Advertisement</h3>
          <div className="ad-content">
            <p>This is a dummy vertical ad.</p>
            <p>Ad content goes here.</p>
          </div>
        </div>


    {/* heck how its skicy here */}
        <div className="ad-container">
          <h3>Are you a Developer looking to showcase youre Projects?</h3>
          <div className="ad-content">
            <p>Post your property and reach a wider audience.</p>
            <button className="post-property-button">Post Property</button>
          </div>
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