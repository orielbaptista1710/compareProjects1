// frontend-vite/src/components/Breadcrumbs.jsx

import { Link, useLocation, matchPath } from "react-router-dom";
import { Home, ChevronRight } from "lucide-react";
import { useProperty } from "../../hooks/useProperty";
import "./Breadcrumbs.css";

const routeNameMap = {
  "": "Home",
  properties: "Properties",
  compare: "Compare",
  "property-guide": "Property Guide",
  supportHelp: "Support",
  interior: "Home Interiors",
  apnaloan: "ApnaLoans",
  dashboard: "Developer Dashboard",
  admin: "Admin",
  "customer-profile": "Profile",
  "privacy-policy": "Privacy Policy",
  terms: "Terms & Conditions",
};

// const HIDDEN_SEGMENTS = new Set(["property"]);

const safeLabel = (value = "") => {
  try {
    return decodeURIComponent(value)
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  } catch {
    return value
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
};

const Breadcrumbs = ({ hasNavbar = false }) => {
  const location = useLocation();

  const pathnames = location.pathname
    .split("/")
    .filter(Boolean);

  const propertyMatch = matchPath(
    "/property/:id",
    location.pathname
  );

  const propertyId = propertyMatch?.params?.id;

  const {
    property,
    loading: propertyLoading,
  } = useProperty(propertyId);

  if (location.pathname === "/") {
    return null;
  }

  const visibleSegments = pathnames
    .map((value, index) => ({
      value,
      to:
        "/" +
        pathnames
          .slice(0, index + 1)
          .join("/"),
    }))
    .filter(
      ({ value }) => value !== "property"
    );

  const labelFor = (value) => {
    // Property detail page
    if (propertyId && value === propertyId) {
      if (property?.title) {
        return property.title;
      }

      return propertyLoading
        ? "Loading property..."
        : "Property";
    }

    return routeNameMap[value] || safeLabel(value);
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${window.location.origin}/`,
      },

      ...visibleSegments.map(({ value, to }, index) => ({
        "@type": "ListItem",
        position: index + 2,
        name: labelFor(value),
        item: `${window.location.origin}${to}`,
      })),
    ],
  };

  return (
    <nav
      aria-label="Breadcrumb"
      className={`breadcrumbs ${
        hasNavbar
          ? "breadcrumbs--with-nav"
          : "breadcrumbs--no-nav"
      }`}
    >
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>

      <ol className="breadcrumbs-list">
        <li className="breadcrumbs-item">
          <Link
            to="/"
            className="breadcrumbs-link breadcrumbs-home"
            aria-label="Home"
          >
            <Home
              size={18}
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <span className="breadcrumbs-home-text">
              Home
            </span>
          </Link>
        </li>

        {visibleSegments.map(({ value, to }, index) => {
          const isLast =
            index === visibleSegments.length - 1;

          const label = labelFor(value);

          return (
            <li
              key={to}
              className="breadcrumbs-item"
            >
              <ChevronRight
                className="breadcrumbs-chevron"
                size={17}
                strokeWidth={1.7}
                aria-hidden="true"
              />

              {isLast ? (
                <span
                  className="breadcrumbs-current"
                  aria-current="page"
                  title={label}
                >
                  {label}
                </span>
              ) : (
                <Link
                  to={to}
                  className="breadcrumbs-link"
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;