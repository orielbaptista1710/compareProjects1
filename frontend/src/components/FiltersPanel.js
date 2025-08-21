import React from 'react';
import Select from 'react-select';
import BudgetFilter from '../components/BudgetFilter';
import { FiFilter } from 'react-icons/fi';
import './FiltersPanel.css';

function FiltersPanel({
  filters,
  updateFilter,
  clearAllFilters,
  setMoreFiltersOpen,
  propertyTypeOptions,
  bhkTypeOptions,
  cities,
  localities,
  properties
}) {
  return (
    <div className="filters-container">
      <div className="filter-group">
        <label>State</label>
        <select
          value={filters.state}
          onChange={(e) => updateFilter('state', e.target.value)}
        >
          <option value="">All States</option>
          {[...new Set(properties.map(p => p.state))].map(state => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>City</label>
        <select
          value={filters.city}
          onChange={(e) => updateFilter('city', e.target.value)}
          disabled={!filters.state}
        >
          <option value="">All Cities</option>
          {cities.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Locality</label>
        <select
          value={filters.locality}
          onChange={(e) => updateFilter('locality', e.target.value)}
          disabled={!filters.city}
        >
          <option value="">All Localities</option>
          {localities.map(locality => (
            <option key={locality} value={locality}>{locality}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Property Type</label>
        <Select
          isMulti
          options={propertyTypeOptions}
          value={filters.propertyTypes.map(type => ({ value: type, label: type }))}
          onChange={(selected) => updateFilter('propertyTypes', selected.map(o => o.value))}
          className="multi-select"
          placeholder="Select types..."
        />
      </div>

      <div className="filter-group">
        <label>BHK Type</label>
        <Select
          isMulti
          options={bhkTypeOptions}
          value={filters.bhkTypes.map(bhk => ({ value: bhk, label: `${bhk} BHK` }))}
          onChange={(selected) => updateFilter('bhkTypes', selected.map(o => o.value))}
          className="multi-select"
          placeholder="Select BHK..."
        />
      </div>

      <div className="filter-group">
        <label>Budget</label>
        <BudgetFilter
          budgetRange={filters.budgetRange}
          setBudgetRange={(range) => updateFilter('budgetRange', range)}
        />
      </div> 

      <button 
        className="more-filters-btn" 
        onClick={() => setMoreFiltersOpen(true)}
        aria-label="More filters"
      >
        <FiFilter /> More Filters
      </button>
      
      <button 
        onClick={clearAllFilters} 
        className="clear-filters-btn"
        aria-label="Clear all filters"
      >
        Clear Filters
      </button>
    </div>
  );
}

export default FiltersPanel;
