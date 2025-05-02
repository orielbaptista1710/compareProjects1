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
      <h1 className="h1">Find Your Right Property Match</h1>
      {/* <a className="description-title">Established fact that a reader will be distracted by the readable content of a page when looking at its layout. .</a> */}

      <form className="search-container" onSubmit={handleSearch}>
        <div className="main-seach-container">
        <div className="seatch-field">
          <select
          id="city"
          name="city"
          className="dropdown-main"
          value={city}
          onChange={(e) => setCity(e.target.value)}>
            <option value="">Select City</option>
          {cities?.map((cityItem, index) => (
            <option key={index} value={cityItem}>{cityItem}</option>
          ))}
          </select>

        </div>

        <div className="seatch-field">
          <select
          id="locality"
          name="locality"
          className="dropdown-main"
          value={locality}
          onChange={(e) => setLocality(e.target.value)}>

          <option value="">Select Locality</option>
          {localities?.map((localityItem, index) => (
            <option key={index} value={localityItem}>{localityItem}</option>
          ))}
        </select>
        </div>

        <div className="seatch-field">
          <select 
          id="property-type"
          name="type"
          className="dropdown-main"
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}>
          <option value="Residental">Residential</option>
          <option value="Industrial">Industrial</option>
          <option value="Commercial">Commercial</option>
          <option value="Plot">Plot</option>
          <option value="Retail">Retail</option>
          </select>
        </div>

        <div className="seatch-field">
          <select 
          id="budget"
          name="budget"
         className="dropdown-main"
         value={budget}
         onChange={(e) => setBudget(e.target.value)}>
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
        </div>

        <button className="mainsearch-btn" type="submit">
          Compare Now 
        </button>

        </div>

        {/* <button className="advanced-search-btn" type="button" onClick={() => navigate('/properties')}>
          Advanced Search →
        </button> */}

      </form>
    </div>
  );
};

export default MainSearchBar;
