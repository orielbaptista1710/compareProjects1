// src/components/PropertiesPageComponents/FilterComponents/BudgetFilter.js
import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import "./BudgetFilter.css";

const BudgetFilter = ({ minBudget, maxBudget, onChange, priceRange }) => {
  const [showMinDropdown, setShowMinDropdown] = useState(false);
  const [showMaxDropdown, setShowMaxDropdown] = useState(false);
  
  const minDropdownRef = useRef(null);
  const maxDropdownRef = useRef(null);

  // Generate price options based on backend range
  const generatePriceOptions = () => {
    if (!priceRange?.min || !priceRange?.max) {
      // Fallback options if backend doesn't provide range
      return [
        5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 100,
        125, 150, 175, 200, 250, 300, 400, 500
      ];
    }

    const options = [];
    const minLakhs = Math.floor(priceRange.min / 100000);
    const maxLakhs = Math.ceil(priceRange.max / 100000);
    
    // Generate options in 5 lakh increments up to 50L
    for (let i = 5; i <= Math.min(50, maxLakhs); i += 5) {
      options.push(i);
    }
    
    // Add larger increments for higher values
    if (maxLakhs > 50) {
      for (let i = 60; i <= Math.min(100, maxLakhs); i += 10) {
        options.push(i);
      }
    }
    
    if (maxLakhs > 100) {
      for (let i = 125; i <= Math.min(500, maxLakhs); i += 25) {
        options.push(i);
      }
    }

    return [...new Set(options)].sort((a, b) => a - b);
  };

  const priceOptions = generatePriceOptions();

  // Format price for display
  const formatPrice = (lakhs) => {
    if (!lakhs) return "";
    if (lakhs >= 100) {
      return `₹ ${lakhs / 100} Cr`;
    }
    return `₹ ${lakhs} Lakhs`;
  };

  // Get filtered options for dropdowns
  const getMinOptions = () => {
    if (!maxBudget) return priceOptions;
    const maxValue = parseInt(maxBudget);
    return priceOptions.filter(opt => opt < maxValue);
  };

  const getMaxOptions = () => {
    if (!minBudget) return priceOptions;
    const minValue = parseInt(minBudget);
    return priceOptions.filter(opt => opt > minValue);
  };

  // Handle selection
  const handleMinSelect = (value) => {
    onChange("minBudget", value.toString());
    setShowMinDropdown(false);
  };

  const handleMaxSelect = (value) => {
    onChange("maxBudget", value.toString());
    setShowMaxDropdown(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (minDropdownRef.current && !minDropdownRef.current.contains(event.target)) {
        setShowMinDropdown(false);
      }
      if (maxDropdownRef.current && !maxDropdownRef.current.contains(event.target)) {
        setShowMaxDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="budget-filter">
      <div className="budget-inputs">
        {/* Min Budget Dropdown */}
        <div className="budget-dropdown" ref={minDropdownRef}>
          <button
            className="budget-select"
            onClick={() => {
              setShowMinDropdown(!showMinDropdown);
              setShowMaxDropdown(false);
            }}
          >
            <span className={minBudget ? "selected" : "placeholder"}>
              {minBudget ? formatPrice(parseInt(minBudget)) : "Min"}
            </span>
            <ChevronDown size={16} className="dropdown-icon" />
          </button>

          {showMinDropdown && (
            <div className="budget-dropdown-menu">
              <div className="budget-dropdown-scroll">
                {minBudget && (
                  <div
                    className="budget-option clear-option"
                    onClick={() => handleMinSelect("")}
                  >
                    Clear Min
                  </div>
                )}
                {getMinOptions().map((value) => (
                  <div
                    key={value}
                    className={`budget-option ${
                      minBudget === value.toString() ? "selected" : ""
                    }`}
                    onClick={() => handleMinSelect(value)}
                  >
                    {formatPrice(value)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Max Budget Dropdown */}
        <div className="budget-dropdown" ref={maxDropdownRef}>
          <button
            className="budget-select"
            onClick={() => {
              setShowMaxDropdown(!showMaxDropdown);
              setShowMinDropdown(false);
            }}
          >
            <span className={maxBudget ? "selected" : "placeholder"}>
              {maxBudget ? formatPrice(parseInt(maxBudget)) : "Max"}
            </span>
            <ChevronDown size={16} className="dropdown-icon" />
          </button>

          {showMaxDropdown && (
            <div className="budget-dropdown-menu">
              <div className="budget-dropdown-scroll">
                {maxBudget && (
                  <div
                    className="budget-option clear-option"
                    onClick={() => handleMaxSelect("")}
                  >
                    Clear Max
                  </div>
                )}
                {getMaxOptions().map((value) => (
                  <div
                    key={value}
                    className={`budget-option ${
                      maxBudget === value.toString() ? "selected" : ""
                    }`}
                    onClick={() => handleMaxSelect(value)}
                  >
                    {formatPrice(value)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(BudgetFilter);