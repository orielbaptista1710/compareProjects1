import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  // Size classes mapping
  const sizeClasses = {
    sm: {
      spinner: 'spinner-border-sm',
      text: 'small'
    },
    md: {
      spinner: '',
      text: ''
    },
    lg: {
      spinner: '',
      text: 'h4'
    }
  };

  return (
    <div className="d-flex flex-column align-items-center justify-content-center my-4">
      <div 
        className={`spinner-border text-purple ${sizeClasses[size].spinner}`} 
        style={{ width: '10rem', height: '10rem', color: '#9417E2' }} 
        role="status"
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      {text && (
        <p className={`mt-2 text-purple ${sizeClasses[size].text}`} style={{ color: '#9417E2' }}>
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;