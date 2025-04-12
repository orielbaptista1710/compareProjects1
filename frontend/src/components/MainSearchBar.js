import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./MainSearchBar.css";
import axios from "axios";

const MainSearchBar = () => {
  const navigate = useNavigate();

  // Search Filters
  const [propertyType, setPropertyType] = useState("");
  const [budget, setBudget] = useState("");
  const [city, setCity] = useState("");
  const [locality, setLocality] = useState("");

  const [localities, setLocalities] = useState([]);
  const [cities, setCities] = useState([]);

  // Fetch Cities & Localities from MongoDB
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/properties/filters");
        setCities(response.data?.cities || []); // Ensure data exists
        setLocalities(response.data?.localities || []);
      } catch (error) {
        console.error("Error fetching filters:", error);
      }
    };
    fetchFilters();
  }, []);

  // Handle Search Button Click
  const handleSearch = (event) => {
    event.preventDefault();

    // Construct the query params only if values are selected
    const queryParams = new URLSearchParams();
    if (propertyType) queryParams.append("type", propertyType);
    if (budget) queryParams.append("budget", budget);
    if (city) queryParams.append("city", city);
    if (locality) queryParams.append("locality", locality);

    navigate(`/properties?${queryParams.toString()}`);
  };

  return (
    <div className="mainsearch-bar">
      <h1>Find Your Right Property Match</h1>
      <form className="mainsearch-container" onSubmit={handleSearch}>

        {/* Property Type Dropdown */}
        <select
          name="type"
          className="dropdown-main"
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
        >
          <option value="">Property Type</option>
          <option value="Residential">Residential</option>
          <option value="Industrial">Industrial</option>
          <option value="Commercial">Commercial</option>
          <option value="Plot">Plot</option>
          <option value="Retail">Retail</option>
        </select>

        {/* Budget Dropdown */}
        <select
          name="budget"
          className="dropdown-main"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
        >
          <option value="">Select Budget</option>
          <option value="5000000">Up to ₹5 Lakh</option>
          <option value="10000000">Up to ₹1 Cr</option>
          <option value="20000000">Up to ₹2 Cr</option>
          <option value="30000000">Up to ₹3 Cr</option>
          <option value="40000000">Up to ₹4 Cr</option>
          <option value="50000000">Up to ₹5 Cr</option>
          <option value="60000000">Up to ₹6 Cr</option>
          <option value="70000000">Up to ₹7 Cr</option>
        </select>

        {/* City Dropdown */}
        <select
          name="city"
          className="dropdown-main"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        >
          <option value="">Select City</option>
          {cities?.map((cityItem, index) => (
            <option key={index} value={cityItem}>{cityItem}</option>
          ))}
        </select>

        {/* Locality Dropdown */}
        <select
          name="locality"
          className="dropdown-main"
          value={locality}
          onChange={(e) => setLocality(e.target.value)}
        >
          <option value="">Select Locality</option>
          {localities?.map((localityItem, index) => (
            <option key={index} value={localityItem}>{localityItem}</option>
          ))}
        </select>

        {/* Search Button */}
        <button className="mainsearch-btn" type="submit">
          Compare Now 
        </button>

        {/* Advanced Search Button */}
        <button className="advanced-search-btn" type="button" onClick={() => navigate('/properties')}>
          Advanced Search →
        </button>
      </form>
    </div>
  );
};

export default MainSearchBar;
