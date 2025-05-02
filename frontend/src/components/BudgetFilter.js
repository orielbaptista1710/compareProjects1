import React, { useState, useRef, useEffect } from 'react';
import './BudgetFilter.css';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

const BudgetFilter = ({ budgetRange, setBudgetRange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMinChange = (e) => {
    setBudgetRange(prev => ({ ...prev, min: e.target.value }));
  };

  const handleMaxChange = (e) => {
    setBudgetRange(prev => ({ ...prev, max: e.target.value }));
  };

  const displayLabel = budgetRange.min || budgetRange.max
    ? `₹${budgetRange.min || '0'} - ₹${budgetRange.max || 'Any'}`
    : 'Budget';

  return (
    <div className="budget-filter" ref={ref}>
      <button className="budget-button" onClick={toggleDropdown}>
        {displayLabel}
        <span className="arrow">&#9662;</span>
      </button>

      {isOpen && (
        <div className="budget-container">
          <div className="budget-dropdown">
            <div className="budget-input-group">
              <input
                type="number"
                placeholder="Min"
                value={budgetRange.min}
                onChange={handleMinChange}
                min="0"
              />
            </div>
            <span>to</span>
            <div className="budget-input-group">
              <input
                type="number"
                placeholder="Max"
                value={budgetRange.max}
                onChange={handleMaxChange}
                min="0"
              />
            </div>
          </div>
            {/* //10000000 */}
          <div className="budget-silder-wrapper">
            <Slider
              range
              min={0}
              max={1000000000}
              step={50000}
              value={[
                isNaN(Number(budgetRange.min)) ? 0 : Number(budgetRange.min),
                isNaN(Number(budgetRange.max)) ? 10000000 : Number(budgetRange.max)
              ]}
              onChange={(newValue) => {
                if (Array.isArray(newValue) && newValue.length === 2) {
                  const [min, max] = newValue;
                  setBudgetRange({ min, max });
                }
              }}
              allowCross={false}
              trackStyle={[{ backgroundColor: '#D90429' }]}
              handleStyle={[
                { borderColor: '#D90429' },
                { borderColor: '#D90429' }
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetFilter;
