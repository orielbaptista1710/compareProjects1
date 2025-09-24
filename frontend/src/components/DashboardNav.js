import React, { useState }  from 'react';
import './DashboardNav.css';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome, faPlusCircle, faClipboardList, faHeadset, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";


const DashboardNav = ({ activeTab, setActiveTab, user, handleLogout }) => {
  const [dashboardOpen, setDashboardOpen] = useState(false);

  return (
    <div className="dashboard-nav">
      <div className='dashboard-nav-container'>
        <div className="profile-section">
          <div className="profile-name">Welcome,</div>
          <div className="profile-name">{user?.displayName || 'Developer'}</div>
          {/* <p>Welcome to your property dashboard. Here you can manage your listings, update info, and view stats.</p> */}
        </div>

        <ul className="nav-list">
          
             <li className="nav-item dashboard-dropdown">
             <div
               className="dropdown-trigger"
               onClick={() => setDashboardOpen(!dashboardOpen)}
             >
               <FontAwesomeIcon icon={faHome} className="nav-icon" />
               <span>Overview</span>
             </div>

           {/* add these data to the proeprty.js  */}
             <ul className={`dropdown-content ${dashboardOpen ? 'open' : ''}`}>
               <li className="stat-card">Total Properties: </li>
               <li className="stat-card">Pending Approvals: </li>
               <li className="stat-card">Site Visits: </li>
             </ul>
           </li>


             <li
               className={`nav-item ${activeTab === 'sell' ? 'active' : ''}`}
               onClick={() => setActiveTab('sell')}
             >
               <FontAwesomeIcon icon={faPlusCircle} className="nav-icon" />
               Sell Property
             </li>

             <li
               className={`nav-item ${activeTab === 'properties' ? 'active' : ''}`}
               onClick={() => setActiveTab('properties')}
             >
               <FontAwesomeIcon icon={faClipboardList} className="nav-icon" />
               My Properties
             </li>

             <li className="nav-item" >
               <FontAwesomeIcon icon={faHeadset} className="nav-icon" />
               Support / Help Center
             </li>

             <li className="nav-item" onClick={handleLogout}>
               <FontAwesomeIcon icon={faSignOutAlt} className="nav-icon" />
               Log Out
             </li>
           </ul>

      </div>

    </div>
  );
};

export default DashboardNav;
