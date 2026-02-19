// src/components/PropertiesPageComponents/FilterComponents/FilterPanel.js
import React from "react";
import {
  Filter,
  Search,
  // DollarSign,
  Home,
  Building2,
  Layers,
  Compass,
  Car,
  MapPin,
  // Clock,
  // CheckCircle,
} from "lucide-react";

import FilterSection from "./FilterSection";
import CheckboxGroup from "./CheckboxGroup";
// import BudgetFilter from "./BudgetFilter";
import LocalityFilter from "./LocalityFilter";
import { useCity } from "../../../../contexts/CityContext";

import "./FilterPanel.css";

const FilterPanel = ({
  filters,
  onFilterChange,     
  filterOptions = {},
  searchQuery,
  onSearchChange,
}) => {

  const { city } = useCity();


  /* ---------------- Render ---------------- */
  return (
    <aside className="filter-panel">
      {/* Header */}
      <div className="filter-header">
        <h3>
          <Filter size={16} /> Filters
        </h3>
        
      </div>

      <div className="filter-panel-scroll">

      {/* Search */}
      <FilterSection title="Search" icon={Search}>
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            className="filter-search"
            type="text"
            placeholder="Search properties..."
            value={searchQuery ?? ""}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

      </FilterSection>



      {/* Property Type */}
      <FilterSection title="Property Type" icon={Building2}>
        <CheckboxGroup
          options={filterOptions.propertyTypeOptions || []}
          value={filters.propertyType  ?? ""}
          onChange={(value) => onFilterChange("propertyType", value)}
        />
      </FilterSection>

      {/* Locality */}
      {city && (
      <FilterSection title="Localities" icon={MapPin}>
        <LocalityFilter
          value={filters.locality ?? ""}
          onChange={(value) => onFilterChange("locality", value)}
        />
      </FilterSection>
      )}


      {/* BHK */}
      <FilterSection title="BHK Type" icon={Home}>
        <CheckboxGroup
          options={["1", "2", "3", "4", "5+"]}
          value={filters.bhk ?? []}
          renderLabel={(v) => `${v} BHK`}
          onChange={(value) => onFilterChange("bhk", value)}
        />
      </FilterSection>

      {/* Furnishing */}
      <FilterSection title="Furnishing" icon={Layers} initiallyOpen={false}>
        <CheckboxGroup
          options={filterOptions.furnishingOptions || []}
          value={filters.furnishing}
          onChange={(value) => onFilterChange("furnishing", value)}
        />
      </FilterSection>


      {/* Facing */}
      <FilterSection title="Facing" icon={Compass} initiallyOpen={false}>
        <CheckboxGroup
          options={filterOptions.facingOptions || []}
          value={filters.facing}
          onChange={(value) => onFilterChange("facing", value)}
        />
      </FilterSection>

      {/* Parking */}
      <FilterSection title="Parking" icon={Car} initiallyOpen={false}>
        <CheckboxGroup
          options={filterOptions.parkingOptions || []}
          value={filters.parkings}
          onChange={(value) => onFilterChange("parkings", value)}
        />
      </FilterSection>
       </div>
    </aside>
  );
};

export default React.memo(FilterPanel);

