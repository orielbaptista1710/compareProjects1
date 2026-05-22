import React from "react";
import { useNavigate } from "react-router-dom";
import Seo from "../database/Seo";
import "./ErrorPage.css";

const ErrorPage = () => {
  const navigate = useNavigate();

  return (
    <div className="error-page">
        <Seo
        title="404 | CompareProjects"
        description="The page you were looking for could not be found. Return to CompareProjects Home to continue exploring verified real estate projects."
        />

      <div className="error-content">
        <h1>404</h1>
        <h2>Oops! Page Not Found</h2>
        <p>
          The page you’re looking for doesn’t exist, was removed, or is temporarily unavailable.
        </p>

        <button
          className="error-btn"
          onClick={() => navigate("/")}
          aria-label="Go back to Home"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default ErrorPage;
