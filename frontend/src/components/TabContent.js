import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSwimmer, faChair, faSmokingBan, faSort, faMoneyBillWave,
  faWifi, faAmbulance, faDumbbell, faShieldAlt, faDoorOpen,
  faChessBoard, faGamepad, faSpa, faTree, faWater, faParking,
  faRunning, faFireExtinguisher, faUsers, faHome, faLock, faBook,
  faVideo, faDrawPolygon, faFingerprint, faCoffee, faUmbrellaBeach, faTruckLoading, faTruck, faSchool,
  faRoad, faBell, faBolt, faCloudRain, faBellConcierge,
  faCarSide, faElevator, faSignOutAlt, faRestroom, faSnowflake, faSolarPanel, faStreetView,
  faDrumstickBite, faIdCard, faUserShield, faBorderAll, faTrafficLight,
  faUtensils, faWarehouse, faShoePrints, faChild, faSeedling,
  faExclamationTriangle, faMoon, faLightbulb, faUserLock, faFire,
  faGraduationCap, faBus, faSubway, faShoppingCart, faHospital,
  faTrain, faPlane, faBinoculars, faIndustry, faFutbol, faLeaf
} from "@fortawesome/free-solid-svg-icons";

import "./TabContent.css";

const amenityIcons = {
  "Swimming Pool": faSwimmer,
  "Pool": faSwimmer,
  "Internet / Wi-Fi": faWifi,
  "Gym": faDumbbell,
  "Fire Fighting System": faFireExtinguisher,
  "Flower Garden": faTree,
  "Garden": faTree,
  "24X7 Water Supply": faWater,
  "Closed Car Parking": faParking,
  "Jogging Track": faRunning,
  "Gated Community": faHome,
  "Children's Play Area": faGamepad,
  "Senior Citizen Siteout": faUsers,
  "Yoga / Meditation": faSpa,
  "Conference Rooms": faUsers,
  "Cafeteria": faCoffee,
  "Private Beach Access": faUmbrellaBeach,
  "Loading Docks": faTruckLoading,
  "Truck Parking": faTruck,
  "Club House": faUsers,
  "Nearby Schools & Hospitals": faSchool,
  "Library": faBook,
  "Chess Board": faChessBoard,
  "Public Restrooms": faRestroom,
  "Wheelchair Accessibility": faChild,
  "Conference Room": faUsers,
  "Board Room": faUsers,
  "Cafe": faCoffee,
  "Lounge": faChair,
  "Rooftop Garden": faTree,
  "Fitness Center": faDumbbell,
  "Near Hospital": faHospital,
  "Near Ambulance Service": faAmbulance,
  "Near School Area": faSchool,
  "Near College/University": faGraduationCap,
  "Near Shopping Mall": faShoppingCart,
  "Near Public Transport": faBus,
  "Near Metro Station": faSubway,
  "ATM": faMoneyBillWave,
  "Escalators": faSort,
  "Loading Dock": faTruckLoading,
  "Warehouse": faWarehouse,
  "Canteen": faUtensils,
  "Community Parks": faTree,
  "Walking Paths": faShoePrints,
  "Playground": faChild,
  "Green Landscaping": faSeedling,
  "Parking": faParking,
  "Wide Roads": faRoad,
  "Water & Electricity Connections": faWater,
  "Rainwater Harvesting": faCloudRain,
  "Lifts": faDoorOpen,
  "Concierge Service": faBellConcierge,
  "Basement Parking": faParking,
  "Power Backup": faBolt,
  "Valet Parking": faCarSide,
  "Lift(s)": faElevator,
  "Multiple Entry & Exit Points": faSignOutAlt,
  "Customer Parking": faParking,
  "Public Toilets": faRestroom,
  "Air Conditioning": faSnowflake,
  "Near Highway": faRoad,
  "Near Airport": faPlane,
  "Near Railway Station": faTrain,
  "Near Industrial Hub": faIndustry,
  "Near Tourist Attractions": faBinoculars,
  "Near Stadium": faFutbol,
  "Near Parks & Greenery": faTree,
  "Near Lakes & Water Bodies": faWater,
  "Near Beach": faUmbrellaBeach,
  "Near Forest Reserve": faLeaf,
  "Solar Power Backup": faSolarPanel,
  "Water Treatment Plant": faWater,
  "Multi-modal Transport Connectivity": faTruck,
  "Street Lighting": faStreetView,
  "Drainage System": faDrumstickBite,
  "Visitor Parking": faParking,
  "CCTV Surveillance": faVideo,
  "Fenced Boundary": faDrawPolygon,
  "Biometric Access": faFingerprint,
  "Security Guard": faUsers,
  "Smoke Detectors": faSmokingBan,
  "Video Door Security": faLock,
  "24/7 Security": faShieldAlt,
  "Emergency Alarm System": faExclamationTriangle,
  "Access Card Entry": faIdCard,
  "Fire Safety System": faFireExtinguisher,
  "RFID-based Entry": faIdCard,
  "Security Guards": faUserShield,
  "Anti-Theft Alarms": faBell,
  "Digital Access Control": faFingerprint,
  "Night Surveillance": faMoon,
  "Fenced Perimeter": faDrawPolygon,
  "Gated Premises": faLock,
  "Emergency Medical Assistance": faAmbulance,
  "Near Police Station": faShieldAlt,
  "Near Fire Station": faFire,
  "Boundary Wall": faBorderAll,
  "Boom Barriers at Entrance": faTrafficLight,
  "Street Lighting for Safety": faLightbulb,
  "Resident Access Control": faUserLock,
};

const TabContent = ({ property }) => {
  const sections = [
    { key: "amenities", label: "Amenities" },
    { key: "facilities", label: "Facilities" },
    { key: "security", label: "Security" },
  ];

  return (
    <div className="tab-content">
      {sections.map(({ key, label }) =>
        property[key]?.length > 0 ? (
          <div key={key} className="grid-wrapper">
            <h4>{label}</h4>
            <div className="grid-container">
              {property[key].map((item, index) => (
                <div key={index} className="grid-item">
                  <FontAwesomeIcon icon={amenityIcons[item] || faDoorOpen} className="icon" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null
      )}
    </div>
  );
};

export default TabContent;
