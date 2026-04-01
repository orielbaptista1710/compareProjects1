import React from "react";
import { Link, useLocation } from "react-router-dom";
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

const Breadcrumbs = ({ hasNavbar }) => {
  const location = useLocation();

  const pathnames = location.pathname.split("/").filter(Boolean);
  const isHomePage = location.pathname === "/";

  return (
  <div className={`breadcrumbs ${hasNavbar ? "with-nav" : "no-nav"}`}>
      {!isHomePage && <Link to="/">Home</Link>}

      {pathnames.map((value, index) => {
        const to = "/" + pathnames.slice(0, index + 1).join("/");

        const isLast = index === pathnames.length - 1;

        if (value === "property") {
          return null;
        }

        const label =
          routeNameMap[value] ||
          decodeURIComponent(value).replace(/-/g, " ");

        return (
          <span key={to}>
            {" / "}
            {isLast ? (
              <span className="active">{label}</span>
            ) : (
              <Link to={to}>{label}</Link>
            )}
          </span>
        );
      })}
    </div>
  );
};

export default Breadcrumbs;