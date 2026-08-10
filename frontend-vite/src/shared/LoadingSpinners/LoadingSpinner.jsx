// frontend-vite/src/shared/LoadingSpinners/LoadingSpinner.jsx
import "./LoadingSpinner.css";

const LoadingSpinner = ({ text = "Loading..." }) => {
  return (
    <div className="spinner-page-center">
      <span className="loader-spinner" />
      {text && <p className="spinner-text">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;