// EMICalculatorWidget.jsx
import React from 'react';
import './EMICalculatorWidget.css';

const EMICalculatorWidget = ({
  loanAmount,
  interestRate,
  loanTenure,
  onLoanAmountChange,
  onInterestRateChange,
  onLoanTenureChange,
  emi,
  totalAmount,
  totalInterest
}) => {
  const formatCurrency = (amount) => {
    return '₹' + amount.toLocaleString('en-IN');
  };

  const formatCompactCurrency = (amount) => {
    if (amount >= 10000000) return '₹' + (amount / 10000000).toFixed(1) + 'Cr';
    if (amount >= 100000) return '₹' + (amount / 100000).toFixed(1) + 'L';
    return formatCurrency(amount);
  };

  return (
    <div className="emi-widget">
      <div className="widget-header">
        <h3>Calculate Your EMI</h3>
        <div className="widget-badge">Live</div>
      </div>
      
      <div className="widget-controls">
        <div className="control-group">
          <label>Loan Amount</label>
          <div className="amount-display">{formatCurrency(loanAmount)}</div>
          <input
            type="range"
            min="500000"
            max="5000000"
            step="50000"
            value={loanAmount}
            onChange={(e) => onLoanAmountChange(parseInt(e.target.value))}
            className="widget-slider"
          />
        </div>

        <div className="control-group">
          <label>Interest Rate</label>
          <div className="rate-display">{interestRate}%</div>
          <input
            type="range"
            min="6.5"
            max="15"
            step="0.1"
            value={interestRate}
            onChange={(e) => onInterestRateChange(parseFloat(e.target.value))}
            className="widget-slider"
          />
        </div>

        <div className="control-group">
          <label>Tenure</label>
          <div className="tenure-display">{loanTenure} Years</div>
          <input
            type="range"
            min="1"
            max="30"
            value={loanTenure}
            onChange={(e) => onLoanTenureChange(parseInt(e.target.value))}
            className="widget-slider"
          />
        </div>
      </div>

      <div className="widget-result">
        <div className="emi-amount">
          <span>Monthly EMI</span>
          <strong>{formatCurrency(emi)}</strong>
        </div>
        
        <div className="result-details">
          <div className="detail-item">
            <span>Total Interest</span>
            <span>{formatCompactCurrency(totalInterest)}</span>
          </div>
          <div className="detail-item">
            <span>Total Amount</span>
            <span>{formatCompactCurrency(totalAmount)}</span>
          </div>
        </div>

        <button className="widget-cta">Apply Now</button>
      </div>
    </div>
  );
};

export default EMICalculatorWidget;