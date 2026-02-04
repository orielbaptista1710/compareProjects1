import React from "react";
import { ChevronDown } from "lucide-react";

const ResultsHeader = ({ totalMatched, filters, sortBy, setSortBy }) => {
  return (
    <div className="results-header">
      <div className="results-info">
        <h2>
          {totalMatched} Properties {filters.city && `in ${filters.city}`}
        </h2>
        <p>Explore our curated selection of premium properties</p>
      </div>

      <div className="results-controls">
        <div className="sort-dropdown">
          <label htmlFor="sort-by">Sort by</label>
          <div className="select-wrapper">
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="relevance">Relevance</option>
              <option value="price-low-high">Price: Low to High</option>
              <option value="price-high-low">Price: High to Low</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
            <ChevronDown className="dropdown-arrow" size={16} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsHeader;
