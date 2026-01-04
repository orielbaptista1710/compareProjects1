import React from "react";
import "./ErrorBoundary.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error Boundary Caught:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/"; 
  };

  render() {
  console.log("Rendering ErrorBoundary, hasError:", this.state.hasError);
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
            <h1 className="error-boundary-title">Something went wrong.</h1>
            <p className="error-boundary-message">
              Please refresh the page or try again later.
            </p>

            <div className="error-boundary-actions">
              <button
                className="error-boundary-button"
                onClick={this.handleReload}
              >
                Refresh Page
              </button>
              <button
                className="error-boundary-button secondary"
                onClick={this.handleGoHome}
              >
                Go Home
              </button>
            </div>

        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
