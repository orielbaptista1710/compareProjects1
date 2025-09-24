import React, { useState, useRef, useEffect } from 'react';
import './ExpandableSearch.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons/faSearch";
import { faXmark } from "@fortawesome/free-solid-svg-icons/faXmark";
import PropertyCardSmall from '../HomePageComponents/PropertyCardSmall';
import API from '../../api'; // Your axios instance

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
        // Use the API axios instance instead of fetch
        const response = await API.get(`/api/properties/search?query=${encodeURIComponent(query)}`);
        setResults(response.data.slice(0, 2)); // Show top 2 results
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
          {isExpanded ? <FontAwesomeIcon icon={faXmark} /> : <FontAwesomeIcon icon={faSearch} />}
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
            <FontAwesomeIcon icon={faSearch} />
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