CompareProjects – Real Estate Comparison Platform    

CompareProjects is a full-stack real estate web application built with the MERN stack (MongoDB, Express, React, Node.js).
It enables customers and visitors to explore, compare, and manage real estate properties across multiple Indian cities with advanced filters, dashboards, and intelligent search tools.

It also aims to be a specialized platform exclusively for developers. Registered developers can log in to list their properties, which on after administration evalution are posted on the webiste for customer viewing and engament. 
The listed properties are then analyzed using an (AI-powered) comparison module. This module evaluates and compares properties to provide customers with tailored recommendations based on their preferences.

Features

🏠 Property Listings
Dynamic property listings pulled from MongoDB.

Advanced filters for:
Property Type (Apartment, Villa, Plot, etc.)
BHK Type (1BHK, 2BHK, 3BHK…)
Furnishing (Fully / Semi / Unfurnished)
Budget Range
Location (State → City → Locality)
Properties displayed with images, price, and key highlights.
Responsive card layout with clean, modern UI.

👨‍💼 Developer Dashboard
Secure authentication for developers.

Developers can:

Post properties through SellPropertyForm.js.
Edit / Delete their listings.
View all properties associated with their account.

Each property includes:

Detailed metadata (price, location, amenities, contact info).
Availability form (with date picker).
Auto-attached developerId for data integrity.
Status management: pending, approved, rejected.

🔍 Smart Search & Compare

Powerful MainSearchBar with dropdowns for property type, city, locality, price and no of rooms.
Responsive design ensuring consistent layout across devices.
Users can compare multiple projects side by side using the CompareProjects feature.

🏗️ Admin Controls (Planned / Optional)

Approve or reject new listings.
Feature specific properties.
Monitor user & developer analytics(futute improvments)


------------------------------------------------------------------------------------------
Analytics & Monitoring (Optional for Production)

Before going live:
Add Google Analytics (GA4) or Meta Pixel via <Seo> or a dedicated component.
Use Sentry or LogRocket for error monitoring in production.
