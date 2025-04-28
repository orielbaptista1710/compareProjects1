// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import './NavigationBar.css';

// const NavigationBar = () => {
//   const [propertyTypes, setPropertyTypes] = useState([
//     'Residential', 'Commercial', 'Retail', 'Plot', 'Industrial'
//   ]);
//   const [localities, setLocalities] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [hoveredTab, setHoveredTab] = useState(null);

//   const navigate = useNavigate(); // React Router hook for programmatic navigation

//   useEffect(() => {
//     const fetchLocalities = async () => {
//       try {
//         const response = await axios.get('http://localhost:5000/api/properties/localities');
//         setLocalities(response.data);
//       } catch (error) {
//         console.error('Error fetching localities:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchLocalities();
//   }, []);

//   const handleMouseEnter = (type) => {
//     setHoveredTab(type); // Set hovered tab on hover
//   };

//   const handleMouseLeave = () => {
//     setHoveredTab(null); // Remove hovered tab on mouse leave
//   };

//   const handleNavigate = (type, locality) => {
//     navigate(`/properties?type=${type.toLowerCase()}&locality=${locality}`);
//   };

//   return (
//     <div className="navigation-bar">
//       <div className="property-type-tabs">
//         {propertyTypes.map(type => (
//           <div
//             key={type}
//             className="tab-wrapper"
//             onMouseEnter={() => handleMouseEnter(type)} // Show dropdown on hover
//             onMouseLeave={handleMouseLeave} // Hide dropdown on mouse leave
//           >
//             <a
//               href={`/properties?type=${type.toLowerCase()}`}
//               className={`property-tab ${hoveredTab === type ? 'active' : ''}`}
//             >
//               {type.toUpperCase()}
//             </a>

//             {/* Dropdown for localities */}
//             {hoveredTab === type && !loading && (
//               <div className="dropdown">
//                 {localities
//                   .filter(loc => loc.propertyType === type.toLowerCase())
//                   .map(locality => (
//                     <a
//                       key={locality._id}
//                       href="#"
//                       className="dropdown-item"
//                       onClick={() => handleNavigate(type, locality.name)}
//                     >
//                       {locality.name}
//                     </a>
//                   ))}
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default NavigationBar;
