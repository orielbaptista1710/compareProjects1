//DO I MAKE THIS CITY CONTEXT CONCIOUS??
// ResultsHeader.js
import React from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import Skeleton from "react-loading-skeleton";

const ResultsHeader = ({
  totalMatched,
  filters,
  sortBy,
  setSortBy,
  page,
  limit = 12,
  isLoading,
  isFetching,
}) => {
  const from = totalMatched === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, totalMatched);

  const buildSubtitle = () => {
    const parts = [];
    if (filters.search) parts.push(`matching "${filters.search}"`);
    if (filters.propertyType?.length)
      parts.push(filters.propertyType.join(", "));
    if (filters.bhk?.length) parts.push(`${filters.bhk.join(", ")} BHK`);
    if (filters.furnishing?.length) parts.push(filters.furnishing.join(", "));
    return parts.length
      ? `Filtered by: ${parts.join(" · ")}`
      : "Explore our curated selection of premium properties";
  };

  return (
    <div className="results-header">
      <div className="results-info">
        <h2>
          {isLoading ? (
            <Skeleton width={220} height={28} />
          ) : (
            <>
              <span className="results-count">{totalMatched.toLocaleString()}</span>{" "}
              {totalMatched === 1 ? "Property" : "Properties"}
              {filters.city && (
                <span className="results-location"> in {filters.city}</span>
              )}
              {filters.locality?.length === 1 && (
                <span className="results-location">, {filters.locality[0]}</span>
              )}
              {isFetching && !isLoading && (
                <Loader2
                  size={16}
                  className="results-fetching-spinner"
                />
              )}
            </>
          )}
        </h2>

        <p className="results-subtitle">
          {isLoading ? (
            <Skeleton width={280} height={16} />
          ) : totalMatched > 0 ? (
            <>
              <span className="results-range">
                Showing {from}–{to} of {totalMatched.toLocaleString()}
              </span>
              <span className="results-divider">·</span>
              <span className="results-context">{buildSubtitle()}</span>
            </>
          ) : (
            "No properties match your current filters"
          )}
        </p>
      </div>

      <div className="results-controls">
        <div className="sort-dropdown">
          <label htmlFor="sort-by">Sort by</label>
          <div className="select-wrapper">
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              disabled={isLoading}
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