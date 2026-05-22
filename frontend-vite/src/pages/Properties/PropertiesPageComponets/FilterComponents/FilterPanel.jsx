import React from "react";
import {
  Filter,
  Search,
  Home,
  Building2,
  BedDouble,
  Layers, 
  Compass,
  Car,
  MapPin,
  Clock,
  Maximize2,
} from "lucide-react";

import AreaFilter from "./AreaFilter";
import FilterSection from "./FilterSection";
import CheckboxGroup from "./CheckboxGroup";
import BhkPillGroup from "./BhkPillGroup";
import BoxcheckGroup from "./BoxcheckGroup";
import LocalityFilter from "./LocalityFilter";
import { useCity } from "../../../../contexts/CityContext";

import "./FilterPanel.css";

const BHK_OPTIONS = ["1", "2", "3", "4", "5+"];

const FilterPanel = ({
  filters,
  onFilterChange,
  onClearAll,
  filterOptions = {},
  searchQuery,
  onSearchChange,
}) => {
  const { city } = useCity();

  return (
    <aside className="filter-panel" aria-label="Property filters">

      {/* ── Header ── */}
      <div className="filter-header">
        <h3>
          <Filter size={15} />
          Filters
          
        </h3>
          <button
            type="button"
            className="filter-clear-btn"
            onClick={onClearAll}
            aria-label="Clear all filters"
          >
            Clear all
          </button>
      </div>

      {/* ── Scrollable sections ── */}
      <div className="filter-panel-scroll">

        {/* Search */}
        <FilterSection title="Search" icon={Search}>
          <div className="search-box">
            <Search size={13} className="search-icon" aria-hidden="true" />
            <input
              className="filter-search"
              type="search"
              placeholder="Search properties..."
              value={searchQuery ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Search properties"
            />
          </div>
        </FilterSection>

        {/* Area — passes real bounds from API so the slider max matches actual data */}
        <FilterSection
          title="Area"
          icon={Maximize2}
          initiallyOpen={false}
        >
          <AreaFilter
            value={filters.area ?? null}
            onChange={(areaValue) => onFilterChange("area", areaValue ?? null)}
            areaBounds={filterOptions.areaBounds}
          />
        </FilterSection>

        {/* Property Type */}
        <FilterSection
          title="Property type"
          icon={Building2}
        >
          <CheckboxGroup
            options={filterOptions.propertyTypeOptions ?? []}
            value={filters.propertyType ?? []}
            onChange={(value) => onFilterChange("propertyType", value)}
          />
        </FilterSection>

        {/* Localities — only when city is selected */}
        {city && (
          <FilterSection
            title="Localities"
            icon={MapPin}
          >
            <LocalityFilter
              value={filters.locality ?? []}
              onChange={(value) => onFilterChange("locality", value)}
            />
          </FilterSection>
        )}

        {/* BHK */}
        <FilterSection
          title="BHK type"
          icon={Home}
        >
          <BhkPillGroup
            options={BHK_OPTIONS}
            value={filters.bhk ?? []}
            renderLabel={(v) => `${v} BHK`}
            onChange={(value) => onFilterChange("bhk", value)}
          />
        </FilterSection>

        

        {/* Furnishing */}
        <FilterSection
          title="Furnishing"
          icon={BedDouble}
          initiallyOpen={false}
        >
          <BhkPillGroup
            options={filterOptions.furnishingOptions ?? []}
            value={filters.furnishing ?? []}
            onChange={(value) => onFilterChange("furnishing", value)}
          />
        </FilterSection>

        {/* Facing */}
        <FilterSection
          title="Facing"
          icon={Compass}
          initiallyOpen={false}
        >
          <BhkPillGroup
            options={filterOptions.facingOptions ?? []}
            value={filters.facing ?? []}
            onChange={(value) => onFilterChange("facing", value)}
          />
        </FilterSection>

        {/* Parking */}
        <FilterSection
          title="Parking"
          icon={Car}
          initiallyOpen={false}
        >
          <CheckboxGroup
            options={filterOptions.parkingOptions ?? []}
            value={filters.parkings ?? []}
            onChange={(value) => onFilterChange("parkings", value)}
          />
        </FilterSection>

        {/* Possession Status */}
        <FilterSection
          title="Possession status"
          icon={Clock}
          initiallyOpen={false}
        >
          <CheckboxGroup
            options={filterOptions.possessionStatusOptions ?? []}
            value={filters.possessionStatus ?? []}
            onChange={(value) => onFilterChange("possessionStatus", value)}
          />
        </FilterSection>

        {/* Floor Label */}
        <FilterSection
          title="Floor preference"
          icon={Layers}
          initiallyOpen={false}
        >
          <CheckboxGroup
            options={filterOptions.floorLabelOptions ?? []}
            value={filters.floorLabel ?? []}
            onChange={(value) => onFilterChange("floorLabel", value)}
          />
        </FilterSection>

        {/* Amenities & Security */}
        <FilterSection
          title="Amenities & security"
          icon={Layers}
          initiallyOpen={false}
        >
          <BoxcheckGroup
            options={filterOptions.amenitiesOptions ?? []}
            value={filters.amenities ?? []}
            onChange={(value) => onFilterChange("amenities", value)}
          />
        </FilterSection>

      </div>
    

    </aside>
  );
};

export default React.memo(FilterPanel);