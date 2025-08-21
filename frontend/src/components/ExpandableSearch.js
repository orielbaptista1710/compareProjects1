import React, { useState, useRef, useEffect } from 'react';
import './ExpandableSearch.css';
import { FiSearch, FiX } from 'react-icons/fi';
import PropertyCardSmall from './PropertyCardSmall';

const ExpandableSearch = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);

  const toggleSearch = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setQuery('');
      setResults([]);
    }
  };

  useEffect(() => {
    if (isExpanded) inputRef.current?.focus();
  }, [isExpanded]);

  useEffect(() => {
    const fetchResults = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/api/properties/search?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data.slice(0, 2)); // Show top 3 results
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Search submitted:', query);
  };

  return (
    <div className="search-wrapper">
      <div className={`ai-search-container ${isExpanded ? 'expanded' : ''}`}>
        <button
          className="ai-search-toggle"
          onClick={toggleSearch}
          aria-label="Toggle search"
        >
          {isExpanded ? <FiX /> : <FiSearch />}
        </button>

        <form className="ai-search-form" onSubmit={handleSubmit}>
          <input
            type="text"
            ref={inputRef}
            className="ai-search-input"
            placeholder="Search properties, locations..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="ai-search-submit">
            <FiSearch />
          </button>
        </form>
      </div>

      {isExpanded && query && (
        <div className="search-results-dropdown">
          {isLoading ? (
            <div className="search-loading">Loading...</div>
          ) : results.length > 0 ? (
            <div className="property-results">
              {results.map(property => (
                <PropertyCardSmall 
                  key={property._id} 
                  property={{
                    ...property,
                    image: property.images?.[0] || 'https://via.placeholder.com/120x80'
                  }}
                />
              ))}
            </div>
          ) : (
            query.length >= 2 && <div className="no-results">No properties found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExpandableSearch;