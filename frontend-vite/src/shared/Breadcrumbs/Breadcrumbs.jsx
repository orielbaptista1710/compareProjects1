// frontend-vite/src/components/Breadcrumbs.jsx
import { Link, useLocation, matchPath } from "react-router-dom";
import { useProperty } from "../../hooks/useProperty";
import "./Breadcrumbs.css";

const routeNameMap = {
  "": "Home",
  properties: "Properties",
  compare: "Compare",
  "property-guide": "Property Guide",
  supportHelp: "Support",
  interior: "Home Interiors",
  apnaloan: "UpnaLoans",
  dashboard: "Developer Dashboard",
  admin: "Admin",
  "customer-profile": "Profile",
  "privacy-policy": "Privacy Policy",
  terms: "Terms & Conditions",
};

const HIDDEN_SEGMENTS = new Set(["property"]);

const safeLabel = (value) => {
  try {
    return decodeURIComponent(value).replace(/-/g, " ");
  } catch {
    return value.replace(/-/g, " ");
  }
};

const Breadcrumbs = ({ hasNavbar = false }) => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter(Boolean);

  const propertyMatch = matchPath("/property/:id", location.pathname);
  const propertyId = propertyMatch?.params?.id;

  const { data: property } = useProperty(propertyId, { enabled: Boolean(propertyId) });

  if (location.pathname === "/") return null;

  const visibleSegments = pathnames
    .map((value, index) => ({ value, to: "/" + pathnames.slice(0, index + 1).join("/") }))
    .filter(({ value }) => !HIDDEN_SEGMENTS.has(value));

  const labelFor = (value) => {
    if (propertyId && value === propertyId) {
      return property?.title || "Property";
    }
    return routeNameMap[value] || safeLabel(value);
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${window.location.origin}/` },
      ...visibleSegments.map(({ value, to }, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: labelFor(value),
        item: `${window.location.origin}${to}`,
      })),
    ],
  };

  return (
    <nav aria-label="breadcrumb" className={`breadcrumbs ${hasNavbar ? "with-nav" : "no-nav"}`}>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <ol className="breadcrumbs-list">
        <li className="breadcrumbs-item"><Link to="/">Home</Link></li>
        {visibleSegments.map(({ value, to }, index) => {
          const isLast = index === visibleSegments.length - 1;
          const label = labelFor(value);
          return (
            <li key={to} className="breadcrumbs-item">
              {isLast ? (
                <span className="active" aria-current="page">{label}</span>
              ) : (
                <Link to={to}>{label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;