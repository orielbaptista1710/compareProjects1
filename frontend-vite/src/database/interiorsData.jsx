// Data for the Home Interiors page (/interior).
// Copy only — the page's tabs and filters read these arrays as before.
// TODO before launch: replace the portfolio entries and price lines with
// real, verified projects and quotes.

// ----------------------------------------
// SERVICES (Home / Commercial tabs)
// ----------------------------------------
export const homeServices = [
  {
    id: 1,
    title: "Full home interiors",
    description:
      "Design, civil work, electricals, furniture and décor for a new or existing apartment. One point of contact throughout.",
    price: "Most 2 BHKs: ₹8 L to ₹15 L",
  },
  {
    id: 2,
    title: "Modular kitchens and wardrobes",
    description:
      "Factory-made units fitted in days, with a range of finishes and hardware you can see at our studio.",
    price: "Kitchens from ₹2.5 L",
  },
];

export const commercialServices = [
  {
    id: 1,
    title: "Offices, shops and cafés",
    description:
      "Fit-outs planned around your team or customers, built to code and finished on a fixed timeline.",
    price: "Quoted per project",
  },
];

export const serviceTabs = [
  { id: "home", label: "Homes" },
  { id: "commercial", label: "Offices and shops" },
];

// ----------------------------------------
// PORTFOLIO PROJECTS
// ----------------------------------------
export const portfolioFilters = ["all", "living", "kitchen", "bedroom", "office", "retail"];

export const portfolioFilterLabels = {
  all: "All",
  living: "Living room",
  kitchen: "Kitchen",
  bedroom: "Bedroom",
  office: "Office",
  retail: "Retail",
};

export const portfolioItems = [
  { id: 1, category: "living", title: "Calm 3 BHK for a young family", location: "Powai, Mumbai", area: "1,450 sq ft" },
  { id: 2, category: "kitchen", title: "Compact modular kitchen", location: "Thane West", area: "92 sq ft" },
  { id: 3, category: "bedroom", title: "Master bedroom suite", location: "Vasai West", area: "210 sq ft" },
  { id: 4, category: "living", title: "Open-plan family home", location: "Kharghar, Navi Mumbai", area: "1,180 sq ft" },
  { id: 5, category: "office", title: "Studio office for 24 people", location: "Lower Parel, Mumbai", area: "2,400 sq ft" },
  { id: 6, category: "retail", title: "Neighbourhood café", location: "Bandra West, Mumbai", area: "640 sq ft" },
  { id: 7, category: "kitchen", title: "Handleless kitchen with island", location: "Baner, Pune", area: "140 sq ft" },
  { id: 8, category: "bedroom", title: "Kids’ room that grows up", location: "Ghodbunder Road, Thane", area: "130 sq ft" },
];

// ----------------------------------------
// TESTIMONIALS
// ----------------------------------------
export const testimonials = [
  {
    id: 1,
    name: "Amit Desai",
    role: "Homeowner, Mumbai",
    rating: 5,
    content:
      "Their work completely transformed my home. The detailing and finish are world-class!",
  },
  {
    id: 2,
    name: "Priya Singh",
    role: "Kitchen Renovation",
    rating: 5,
    content:
      "Very professional team. The kitchen makeover they delivered looks stunning!",
  },
  {
    id: 3,
    name: "Rahul Verma",
    role: "Office Interior",
    rating: 4,
    content:
      "Our new office design is modern and productive. Great job by the team!",
  },
];
