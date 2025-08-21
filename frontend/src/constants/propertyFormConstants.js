// constants/propertyFormConstants.js
import { FaHome, FaBuilding, FaWarehouse, FaStore, FaMap } from "react-icons/fa";

export const PROPERTY_TYPES = [
  { label: "Residential", icon: <FaHome /> },
  { label: "Industrial", icon: <FaWarehouse /> },
  { label: "Retail", icon: <FaStore /> },
  { label: "Commercial", icon: <FaBuilding /> },
  { label: "Plot", icon: <FaMap /> },
];

export const FURNISHED_OPTIONS = [
  "Furnished", 
  "Semi Furnished", 
  "Unfurnished", 
  "Fully Furnished"
];

export const POSSESSION_STATUS_OPTIONS = [
  "Under Construction",
  "Ready to Move",
  "Ready for Development",
  "Possession Within 3 Months",
  "Possession Within 6 Months",
  "Possession Within 1 Year",
  "Ready for Sale"
];

export const BHK_OPTIONS = ["1", "2", "3", "4", "5+"];
export const BATHROOM_OPTIONS = ["1", "2", "3", "4", "5+"];
export const BALCONY_OPTIONS = ["0", "1", "2", "3", "4+"];

export const FACING_OPTIONS = [
  "East", 
  "West", 
  "North", 
  "South", 
  "North-East", 
  "North-West", 
  "South-East", 
  "South-West"
];

export const PARKING_OPTIONS = [
  "Available",
  "Not Available",
  "2 Wheeler",
  "4 Wheeler",
  "2 Parking Slots",
  "No Parking",
  "Disabled",
  "Basement Parking",
  "Disabled Access Parking",
  "Visitor Parking"
];

export const AGE_OF_PROPERTY_OPTIONS = [
  "New",
  "1-5 years",
  "5-10 years",
  "10+ years"
];

export const FLOOR_OPTIONS = [
  "Ground",
  "1",
  "2",
  "3",
  "4",
  "5+"
];

export const amenitiesList = ["Swimming Pool",
  "Pool",
  "Internet / Wi-Fi",
  "Gym",
  "Fire Fighting System",
  "Flower Garden",
  "Garden",
  "24X7 Water Supply",
  "Closed Car Parking",
  "Jogging Track",
  "Gated Community",
  "Children's Play Area",
  "Senior Citizen Siteout",
  "Yoga / Meditation",
  "Conference Rooms",
  "Private Beach Access",
  "Loading Docks",
  "Club House",
  "Nearby Schools & Hospitals",
  "Library",
  "Chess Board",
  "Public Restrooms",
  "Wheelchair Accessibility",

  // 🏢 **Commercial Amenities**
  "Conference Room",
  "Board Room",
  "Cafeteria",
  "Cafe",
  "Lounge",
  "Rooftop Garden",
  "Fitness Center",

  // 🏬 **Retail Amenities**
  "ATM",
  "Escalators",

  // 🏭 **Industrial Amenities**
  "Loading Dock","Near Hospital",
  "Truck Parking","Near Ambulance Service",
  "Warehouse","Near School Area",
  "Canteen","Near College/University",

  // 🏞 **Plot Amenities**
  "Community Parks",
  "Walking Paths",
  "Playground",
  "Green Landscaping",];

  export const facilitiesList = ["Parking",
  "Wide Roads",
  "Water & Electricity Connections",
  "Near Highway",
  "Rainwater Harvesting",
  "Lifts","Near Railway Station",
  "Concierge Service","Near Airport",
  "Near Stadium","Near Forest Reserve",
  "Near Parks & Greenery",
  "Near Shopping Mall","Near Public Transport",
  "Near Metro Station","Near Beach",
  "Near Lakes & Water Bodies",

  // **Commercial Facilities**
  "Basement Parking",
  "Power Backup",
  "Valet Parking",
  "Lift(s)","Near Tourist Attractions",
  "Multiple Entry & Exit Points",
  "Near Industrial Hub",

  // **Retail Facilities**
  "Customer Parking",
  "Public Toilets",
  "Air Conditioning",

  // **Industrial Facilities**
  "Solar Power Backup",
  "Water Treatment Plant",
  "Multi-modal Transport Connectivity",

  // **Plot Facilities**
  "Street Lighting",
  "Drainage System",
  "Visitor Parking",];

  export const securityList = ["CCTV Surveillance",
  "Anti-Theft Alarms",
  "Fenced Boundary","Digital Access Control",
  "Biometric Access","Night Surveillance",
  "24/7 Security","Emergency Alarm System",
  "Security Guard",
  "Smoke Detectors",
  "Video Door Security",

  // **Commercial Security**
  "Access Card Entry",

  // **Retail Security**
  "Fire Safety System",
  "RFID-based Entry",
  "Security Guards","Near Fire Station",

  // **Industrial Security**
  "Fenced Perimeter","Emergency Medical Assistance",
  "Gated Premises","Near Police Station",

  // **Plot Security**
  "Boundary Wall",
  "Boom Barriers at Entrance",
  "Street Lighting for Safety",
  "Resident Access Control",

];