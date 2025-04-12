import React, { useState } from 'react';
import { FaAngleLeft, FaAngleRight, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './CompareSidebar.css';

const CompareSidebar = ({ compareList, removeFromCompare }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate

  const handleCompareNow = () => {
    // Navigate to the compare page
    navigate('/compare'); // Adjust the path as needed
  };

  return (
    <div className={`compare-sidebar ${isOpen ? 'open' : 'closed'}`}>
      <button className="toggle-btn" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <FaAngleRight /> : <FaAngleLeft />}
      </button>
      
      {isOpen && (
        <div className="sidebar-content">
          <h3>Compare Properties</h3>
          {compareList.length > 0 ? (
            <ul>
              {compareList.map((property) => (
                <li key={property._id} className="compare-item">
                  <img src={property.coverimage} alt={property.title} className="property-image" />
                  <div className="property-info">
                    <p>{property.title}</p>
                    <button className="remove-btn" onClick={() => removeFromCompare(property._id)}>
                      <FaTrash />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No properties selected.</p>
          )}
          {compareList.length > 0 && (
            <button className="compare-now-btn" onClick={handleCompareNow}>
              <span>Compare Now</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CompareSidebar;