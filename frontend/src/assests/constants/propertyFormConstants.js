// constants/propertyFormConstants.js
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCouch, faCar, faChess, faHouse, faBuilding, faWarehouse,
  faStore, faMap, faSwimmer, faMapMarkedAlt, faPeopleRoof, faDoorClosed,
  faWifi, faDumbbell, faShieldAlt, faTree, faWater, faParking, faRunning,
  faFireExtinguisher, faUsers, faHome, faLock, faBook, faVideo,
  faDrawPolygon, faFingerprint, faCoffee, faUmbrellaBeach, faTruckLoading,
  faTruck, faSchool, faRoad, faBell, faBolt, faCloudRain, faBellConcierge,
  faCarSide, faElevator, faSignOutAlt, faRestroom, faSnowflake,
  faSolarPanel, faStreetView, faDrumstickBite, faIdCard, faUserShield,
  faBorderAll, faTrafficLight, faUtensils, faShoePrints, faChild, faSeedling,
  faExclamationTriangle, faMoon, faLightbulb, faUserLock, faFire,
  faGraduationCap, faBus, faSubway, faShoppingCart, faHospital, faTrain,
  faPlane, faBinoculars, faIndustry, faFutbol, faLeaf, faGamepad, faSpa,
  faMoneyBillWave, faDoorOpen, faChessBoard,
  faMicrophone,
  faPlay,faUserTie
} from "@fortawesome/free-solid-svg-icons";

// ---------------- Dropdown / Select Options ----------------

export const PROPERTY_TYPES = [
  { label: "Flats/Apartments", icon: <FontAwesomeIcon icon={faHouse} /> },
  { label: "Villa", icon: <FontAwesomeIcon icon={faBuilding} /> },
  { label: "Plot", icon: <FontAwesomeIcon icon={faMap} /> },
  { label: "Shop/Showroom", icon: <FontAwesomeIcon icon={faStore} /> },
  { label: "Industrial Warehouse/Godown", icon: <FontAwesomeIcon icon={faWarehouse} /> },
  ////////PROPERTY TYPE CHANGE
  { label: "Commercial Land", icon: <FontAwesomeIcon icon={faStore} /> },
  { label: "Office Space", icon: <FontAwesomeIcon icon={faBuilding} /> },
  { label: "Industrial Buildings", icon: <FontAwesomeIcon icon={faBuilding} /> },

];

export const BHK_OPTIONS = ["1", "2", "3", "4", "5+"];

const AREA_UNITS = [
  { value: "sqft", label: "Square Feet" },
  { value: "sqmts", label: "Square Meters" },
  { value: "guntas", label: "Guntas" },
  { value: "hectares", label: "Hectares" },
  { value: "acres", label: "Acres" },
];

export const FURNISHED_OPTIONS = ['Furnished', 'Semi-Furnished', 'Unfurnished', 'Fully Furnished'];

export const POSSESSION_STATUS_OPTIONS = [
  "Under Construction",
  "Ready to Move",
  // "Ready for Development",
  // "Possession Within 3 Months",
  // "Possession Within 6 Months",
  // "Possession Within 1 Year",
  // "Ready for Sale",
  // "New Launch"
];
export const AGE_OF_PROPERTY_OPTIONS =  [        
    "New",
    "0-1 Years",
    "1-5 Years",
    "5-10 Years",
    "10-15 Years",
    "15+ Years"
  ]
; ////CHECK THIS -- not using in UI


export const BATHROOM_OPTIONS = ["1", "2", "3", "4", "5+"];  //NUMBERS?? CHECK THIS
export const BALCONY_OPTIONS = ["0", "1", "2", "3", "4+"];

export const FACING_OPTIONS = [
  "East",
  "West",
  "North",
  "South",
  "North-East",
  "North-West",
  "South-East",
  "South-West",
];

export const PARKING_OPTIONS = [    //CHECK THIS
  "Available",
  "Not Available",
  "2 Wheeler",
  "4 Wheeler",
  "2 Parking Slots",
  "No Parking",
  "Disabled",
  "Basement Parking",
  "Disabled Access Parking",
  "Visitor Parking",
];

export const FLOOR_OPTIONS = ["Ground", "1", "2", "3", "4", "5+"]; //CHECK THIS -- CHECK THE mongo scaped inputs

// ---------------- Amenities / Facilities / Security ----------------
export const amenitiesList = [
  { name: "Swimming Pool", icon: <FontAwesomeIcon icon={faSwimmer} /> },
  { name: "Gym", icon: <FontAwesomeIcon icon={faDumbbell} /> },
  { name: "Garden", icon: <FontAwesomeIcon icon={faTree} /> },
  { name: "Internet / Wi-Fi", icon: <FontAwesomeIcon icon={faWifi} /> },
  { name: "Fire Fighting System", icon: <FontAwesomeIcon icon={faFireExtinguisher} /> },
  { name: "Closed Car Parking", icon: <FontAwesomeIcon icon={faCar} /> },
  { name: "Gated Community", icon: <FontAwesomeIcon icon={faShieldAlt} /> },
  { name: "Club House", icon: <FontAwesomeIcon icon={faCouch} /> },
  { name: "Private Beach Access", icon: <FontAwesomeIcon icon={faUmbrellaBeach} /> },
  { name: "Library", icon: <FontAwesomeIcon icon={faBook} /> },
  { name: "Chess Board", icon: <FontAwesomeIcon icon={faChess} /> },
  { name: "Cafeteria", icon: <FontAwesomeIcon icon={faCoffee} /> },
];
 
export const facilitiesList = [
  { name: "Parking", icon: <FontAwesomeIcon icon={faParking} /> },
  { name: "Water & Electricity Connections", icon: <FontAwesomeIcon icon={faWater} /> },
  { name: "Power Backup", icon: <FontAwesomeIcon icon={faBolt} /> },
  { name: "Wide Roads", icon: <FontAwesomeIcon icon={faRoad} /> },
  { name: "Near Hospital", icon: <FontAwesomeIcon icon={faHospital} /> },
];

export const securityList = [
  { name: "CCTV Surveillance", icon: <FontAwesomeIcon icon={faVideo} /> },
  { name: "Anti-Theft Alarms", icon: <FontAwesomeIcon icon={faExclamationTriangle} /> },
  { name: "Fenced Boundary", icon: <FontAwesomeIcon icon={faDoorClosed} /> },
  { name: "24/7 Security", icon: <FontAwesomeIcon icon={faUserShield} /> },
  { name: "Security Guard", icon: <FontAwesomeIcon icon={faPeopleRoof} /> },
];

// ---------------- Amenity Lookup Map ----------------
export const AMENITY_ICONS = {
  "Swimming Pool": faSwimmer,
  "Gym": faDumbbell,
  "Garden": faTree,
  "Internet / Wi-Fi": faWifi,
  "Fire Fighting System": faFireExtinguisher,
  "Closed Car Parking": faCar,
  "Gated Community": faShieldAlt,
  "Club House": faCouch,
  "Private Beach Access": faUmbrellaBeach,
  "Library": faBook,
  "Chess Board": faChess,
  "Cafeteria": faCoffee,
  "Parking": faParking,
  "Power Backup": faBolt,
  "Wide Roads": faRoad,
  "Near Hospital": faHospital,
  "CCTV Surveillance": faVideo,
  "Anti-Theft Alarms": faExclamationTriangle,
  "Fenced Boundary": faDoorClosed,
  "24/7 Security": faUserShield,
  "Security Guard": faPeopleRoof,
  "24/7 Water Supply": faWater,
  "Security": faUserShield,
  "Intercom": faMicrophone,
  "Security Guards": faPeopleRoof,
  "Clubhouse": faCouch,
  "Children's Play Area": faChild,
  "Lift": faElevator,
  "Landscaped Gardens": faTree,
  "Maintenance Staff": faUserTie,

};
