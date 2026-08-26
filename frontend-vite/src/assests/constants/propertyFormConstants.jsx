// constants/propertyFormConstants.js

import {
  Sofa,
  Car,
  Building,
  Warehouse,
  Store,
  Map,
  Waves,
  Dumbbell,
  Trees,
  Wifi,
  Flame,
  Shield,
  BookOpen,
  Coffee,
  ParkingCircle,
  Zap,
  Road,
  Hospital,
  Video,
  AlertTriangle,
  DoorClosed,
  UserCheck,
  Users,
  Mic,
  Baby,
  User,
} from "lucide-react";

// ─── Dropdown / Select Options ──────────────────────────────

export const PROPERTY_TYPES = [
  { label: "Flats/Apartments", icon: <Building size={16} /> },
  { label: "Villa", icon: <Building size={16} /> },
  { label: "Plot", icon: <Map size={16} /> },
  { label: "Shop/Showroom", icon: <Store size={16} /> },
  { label: "Industrial Warehouse/Godown", icon: <Warehouse size={16} /> },
  { label: "Office Space", icon: <Building size={16} /> },
  { label: "Commercial Land", icon: <Store size={16} /> },
  { label: "Industrial Building", icon: <Building size={16} /> },
];

export const BHK_OPTIONS = ["1", "2", "3", "4", "5+"];

// Area unit options (for dropdowns like in PricingSection)
export const AREA_UNITS = [
  { value: "sqft", label: "Square Feet" },
  { value: "sqmts", label: "Square Meters" },
  { value: "guntas", label: "Guntas" },
  { value: "hectares", label: "Hectares" },
  { value: "acres", label: "Acres" },
];

// Raw unit keys & display labels (for filters and other components)
export const AREA_UNIT_KEYS = ["sqft", "sqmts", "guntas", "hectares", "acres"];

export const AREA_UNIT_LABELS = {
  sqft: "Sq.ft",
  sqmts: "Sq.m",
  guntas: "Guntas",
  hectares: "Hectares",
  acres: "Acres",
};

export const FURNISHED_OPTIONS = ['Furnished', 'Semi Furnished', 'Unfurnished', 'Fully Furnished'];

export const POSSESSION_STATUS_OPTIONS = [
  "Under Construction",
  "Ready to Move",
];

export const AGE_OF_PROPERTY_OPTIONS = [
  "New",
  "0-1 Years",
  "1-5 Years",
  "5-10 Years",
  "10-15 Years",
  "15+ Years",
];

export const BATHROOM_OPTIONS = ["1", "2", "3", "4", "5+"];
export const BALCONY_OPTIONS = ["0", "1", "2", "3", "4+"];

export const FACING_OPTIONS = [
  "East", "West", "North", "South",
  "North-East", "North-West", "South-East", "South-West",
];

export const PARKING_OPTIONS = [
  "Available", "Not Available", "2 Wheeler", "4 Wheeler",
  "2 Parking Slots", "No Parking", "Disabled",
  "Basement Parking", "Disabled Access Parking", "Visitor Parking",
];

export const FLOOR_OPTIONS = ["Ground", "1", "2", "3", "4", "5+"];

// ─── Amenities / Facilities / Security ──────────────────────

export const amenitiesList = [
  { name: "Swimming Pool", icon: <Waves size={16} /> },
  { name: "Gym", icon: <Dumbbell size={16} /> },
  { name: "Garden", icon: <Trees size={16} /> },
  { name: "Internet / Wi-Fi", icon: <Wifi size={16} /> },
  { name: "Fire Fighting System", icon: <Flame size={16} /> },
  { name: "Closed Car Parking", icon: <Car size={16} /> },
  { name: "Gated Community", icon: <Shield size={16} /> },
  { name: "Club House", icon: <Sofa size={16} /> },
  { name: "Private Beach Access", icon: <Waves size={16} /> },
  { name: "Library", icon: <BookOpen size={16} /> },
  { name: "Cafeteria", icon: <Coffee size={16} /> },
];

export const facilitiesList = [
  { name: "Parking", icon: <ParkingCircle size={16} /> },
  { name: "Water & Electricity Connections", icon: <Waves size={16} /> },
  { name: "Power Backup", icon: <Zap size={16} /> },
  { name: "Wide Roads", icon: <Road size={16} /> },
  { name: "Near Hospital", icon: <Hospital size={16} /> },
];

export const securityList = [
  { name: "CCTV Surveillance", icon: <Video size={16} /> },
  { name: "Anti-Theft Alarms", icon: <AlertTriangle size={16} /> },
  { name: "Fenced Boundary", icon: <DoorClosed size={16} /> },
  { name: "24/7 Security", icon: <UserCheck size={16} /> },
  { name: "Security Guard", icon: <Users size={16} /> },
];

// ─── Amenity Icon Lookup ─────────────────────────────────────

export const AMENITY_ICONS = {
  "Swimming Pool": Waves,
  "Gym": Dumbbell,
  "Garden": Trees,
  "Internet / Wi-Fi": Wifi,
  "Fire Fighting System": Flame,
  "Closed Car Parking": Car,
  "Gated Community": Shield,
  "Club House": Sofa,
  "Private Beach Access": Waves,
  "Library": BookOpen,
  "Cafeteria": Coffee,
  "Parking": ParkingCircle,
  "Power Backup": Zap,
  "Wide Roads": Road,
  "Near Hospital": Hospital,
  "CCTV Surveillance": Video,
  "Anti-Theft Alarms": AlertTriangle,
  "Fenced Boundary": DoorClosed,
  "24/7 Security": UserCheck,
  "Security Guard": Users,
  "24/7 Water Supply": Waves,
  "Intercom": Mic,
  "Children's Play Area": Baby,
  "Landscaped Gardens": Trees,
  "Maintenance Staff": User,
};