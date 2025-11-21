// THIS is the data for the interior design services page

// RESIDENTIAL SERVICES

import { Home, Building2, Lightbulb, Users } from "lucide-react";

export const homeServices = [
  {
    id: 1,
    title: "Residential Design",
    description:
      "Transform your house into a dream home with premium interior design.",
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0",
    width: 600,
    height: 400,
    icon: <Home size={32} />,
  },
  {
    id: 2,
    title: "Kitchen Makeover",
    description:
      "Modern, functional kitchen designs that blend aesthetics and practicality.",
    image: "https://images.unsplash.com/photo-1556912173-46c336c7fd55",
    width: 600,
    height: 400,
    icon: <Lightbulb size={32} />,
  },
  {
    id: 3,
    title: "Living Spaces",
    description:
      "Beautiful living rooms that reflect your lifestyle and personality.",
    image: "https://images.unsplash.com/photo-1600494603989-9650cf6dad51",
    width: 600,
    height: 400,
    icon: <Users size={32} />,
  },
];

export const commercialServices = [
  {
    id: 1,
    title: "Corporate Offices",
    description:
      "Professional, modern office spaces that enhance productivity.",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c",
    width: 600,
    height: 400,
    icon: <Building2 size={32} />,
  },
  {
    id: 2,
    title: "Retail Stores",
    description:
      "Attractive store layouts designed to improve product visibility.",
    image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36",
    width: 600,
    height: 400,
    icon: <Lightbulb size={32} />,
  },
];

export const serviceTabs = [
  { id: "home", label: "Home Interiors", icon: <Home size={20} /> },
  { id: "commercial", label: "Commercial Design", icon: <Building2 size={20} /> },
];


// ----------------------------------------
// PORTFOLIO PROJECTS
// ----------------------------------------
export const portfolioFilters = ["all", "kitchen", "living", "office", "retail"];

export const portfolioItems = [
  {
    id: 1,
    category: "kitchen",
    title: "Modern Modular Kitchen",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
  },
  {
    id: 2,
    category: "living",
    title: "Luxury Living Room",
    image: "https://images.unsplash.com/photo-1615870216519-2f9fa2d3d6d3",
  },
  {
    id: 3,
    category: "office",
    title: "Contemporary Office",
    image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36",
  },
  {
    id: 4,
    category: "retail",
    title: "Premium Retail Store",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf",
  },
];


// ----------------------------------------
// TESTIMONIALS
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
