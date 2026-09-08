// src/pages/<CustomerFolder>/CustomerProfilePage/components/TabErrorBoundary.jsx
import { Component } from "react";
import { AlertCircle } from "lucide-react";

class TabErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Tab failed to render:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="tab-panel">
          <div className="empty-state">
            <div className="empty-icon">
              <AlertCircle size={40} strokeWidth={1.5} />
            </div>
            <h3>Something went wrong</h3>
            <p>This section failed to load. Try refreshing the page.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default TabErrorBoundary;