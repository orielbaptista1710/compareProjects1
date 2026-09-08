//CompareErrorBoundary
import { Component } from "react";

class CompareErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Wire to Sentry/logging here later — kept simple for now
    console.error("Compare tab render error:", error, info);
  }

  componentDidUpdate(prevProps) {
    // Auto-recover if the user switches tabs or the property changes
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="tab-content tab-content--error">
          <p className="empty-list">Couldn't load this section.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default CompareErrorBoundary;