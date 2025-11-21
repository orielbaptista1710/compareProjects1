// import React from 'react';
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faSearch } from "@fortawesome/free-solid-svg-icons/faSearch";
// import './SearchBar.css';

// function SearchBar({ searchTerm, setSearchTerm, onSearch }) {
//   return (
//     <div className="search-container">
//       <form
//         className="search-bar"
//         onSubmit={(e) => {
//           e.preventDefault();
//           if (onSearch) onSearch(searchTerm);
//         }}
//       >
//         <input
//           type="text"
//           placeholder="Search by property name, location, developer…"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           className="search-input"
//           aria-label="Search properties"
//         />
//         <button
//           type="submit"
//           className="search-button"
//           aria-label="Search"
//         >
//           <FontAwesomeIcon icon={faSearch} size={18} />
//         </button>
//       </form>
//     </div>
//   );
// }

// export default SearchBar;
