import React, { useState, useEffect } from 'react';
import './ApnaLoansHome.css';

const ApnaLoansHome = () => {
  const [loanAmount, setLoanAmount] = useState(2500000);
  const [interestRate, setInterestRate] = useState(8.4);
  const [loanTenure, setLoanTenure] = useState(20);
  const [emi, setEmi] = useState(21490);
  const [totalInterest, setTotalInterest] = useState(2657600);
  const [totalAmount, setTotalAmount] = useState(5157600);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    calculateEMI();
  }, [loanAmount, interestRate, loanTenure]);

  const calculateEMI = () => {
    const principal = loanAmount;
    const monthlyInterest = interestRate / 12 / 100;
    const numberOfPayments = loanTenure * 12;
    
    const emiValue = principal * monthlyInterest * Math.pow(1 + monthlyInterest, numberOfPayments) / 
                    (Math.pow(1 + monthlyInterest, numberOfPayments) - 1);
    const totalAmountValue = emiValue * numberOfPayments;
    const totalInterestValue = totalAmountValue - principal;
    
    setEmi(Math.round(emiValue));
    setTotalAmount(Math.round(totalAmountValue));
    setTotalInterest(Math.round(totalInterestValue));
  };

  const formatCurrency = (amount) => {
    return '₹' + amount.toLocaleString('en-IN');
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className="loans-page">

      {/* <NavigationBar /> */}

      {/* Hero Section */}
      <section className="loans-hero">
        <div className="loans-container">
          <div className="loans-hero-content">
            <h1>Get Your Dream Home with Apna Loans</h1>
            <p>Lowest interest rates, instant approval, and flexible repayment options</p>
            <a href="#calculator" className="loans-cta-button">Check Eligibility</a>
          </div>
        </div>
      </section>

      {/* Loan Calculator Section */}
      <section id="calculator" className="loans-calculator">
        <div className="loans-container">
          <h2 className="loans-section-title">Home Loan EMI Calculator</h2>
          <p className="loans-section-subtitle">Calculate your EMI and find the right loan amount for your dream home</p>
          
          <div className="calculator-container">
            <div className="calculator-form">
              <div className="form-group">
                <label htmlFor="loan-amount">Loan Amount (₹)</label>
                <input 
                  type="range" 
                  id="loan-amount" 
                  className="range-slider" 
                  min="500000" 
                  max="5000000" 
                  step="50000" 
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(parseInt(e.target.value))}
                />
                <input 
                  type="text" 
                  id="loan-amount-input" 
                  value={formatCurrency(loanAmount)} 
                  onChange={(e) => {
                    const value = parseInt(e.target.value.replace(/[^\d]/g, ''));
                    if (!isNaN(value)) setLoanAmount(value);
                  }}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="interest-rate">Interest Rate (%)</label>
                <input 
                  type="range" 
                  id="interest-rate" 
                  className="range-slider" 
                  min="6.5" 
                  max="12" 
                  step="0.1" 
                  value={interestRate}
                  onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                />
                <input 
                  type="number" 
                  id="interest-rate-input" 
                  value={interestRate} 
                  min="6.5" 
                  max="12" 
                  step="0.1"
                  onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="loan-tenure">Loan Tenure (Years)</label>
                <input 
                  type="range" 
                  id="loan-tenure" 
                  className="range-slider" 
                  min="5" 
                  max="30" 
                  value={loanTenure}
                  onChange={(e) => setLoanTenure(parseInt(e.target.value))}
                />
                <input 
                  type="number" 
                  id="loan-tenure-input" 
                  value={loanTenure} 
                  min="5" 
                  max="30"
                  onChange={(e) => setLoanTenure(parseInt(e.target.value))}
                />
              </div>
            </div>
            
            <div className="calculator-result">
              <h3>Your Monthly EMI</h3>
              <div className="result-amount">{formatCurrency(emi)}</div>
              <p>Total payable amount: {formatCurrency(totalAmount)}</p>
              
              <div className="result-details">
                <div className="result-item">
                  <div className="result-value">{interestRate}%</div>
                  <div className="result-label">Interest Rate</div>
                </div>
                <div className="result-item">
                  <div className="result-value">{loanTenure} Years</div>
                  <div className="result-label">Loan Tenure</div>
                </div>
                <div className="result-item">
                  <div className="result-value">{formatCurrency(totalInterest)}</div>
                  <div className="result-label">Total Interest</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Loan Types Section */}
      <section className="loans-types">
        <div className="loans-container">
          <h2 className="loans-section-title">Our Home Loan Products</h2>
          <p className="loans-section-subtitle">Choose from our range of home loan options designed for every need</p>
          
          <div className="loans-cards">
            <div className="loans-card">
              <div className="loans-card-header">
                <h3>Regular Home Loan</h3>
              </div>
              <div className="loans-card-body">
                <p>Standard home loan for ready-to-move-in properties</p>
                <ul className="loans-features">
                  <li><i className="fas fa-check-circle"></i> Up to ₹5 Crores</li>
                  <li><i className="fas fa-check-circle"></i> Interest from 8.4% p.a.</li>
                  <li><i className="fas fa-check-circle"></i> Tenure up to 30 years</li>
                  <li><i className="fas fa-check-circle"></i> 90% of property value</li>
                </ul>
                <a href="/home-loan" className="loans-cta-button">Apply Now</a>
              </div>
            </div>
            
            <div className="loans-card">
              <div className="loans-card-header">
                <h3>Home Construction Loan</h3>
              </div>
              <div className="loans-card-body">
                <p>Finance for constructing your dream home</p>
                <ul className="loans-features">
                  <li><i className="fas fa-check-circle"></i> Up to ₹3 Crores</li>
                  <li><i className="fas fa-check-circle"></i> Interest from 8.7% p.a.</li>
                  <li><i className="fas fa-check-circle"></i> Tenure up to 25 years</li>
                  <li><i className="fas fa-check-circle"></i> Disbursed in stages</li>
                </ul>
                <a href="/construction-loan" className="loans-cta-button">Apply Now</a>
              </div>
            </div>
            
            <div className="loans-card">
              <div className="loans-card-header">
                <h3>Home Extension Loan</h3>
              </div>
              <div className="loans-card-body">
                <p>Expand or renovate your existing home</p>
                <ul className="loans-features">
                  <li><i className="fas fa-check-circle"></i> Up to ₹1 Crore</li>
                  <li><i className="fas fa-check-circle"></i> Interest from 9.2% p.a.</li>
                  <li><i className="fas fa-check-circle"></i> Tenure up to 20 years</li>
                  <li><i className="fas fa-check-circle"></i> Quick approval process</li>
                </ul>
                <a href="/extension-loan" className="loans-cta-button">Apply Now</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="loans-process">
        <div className="loans-container">
          <h2 className="loans-section-title">Simple Application Process</h2>
          <p className="loans-section-subtitle">Get your home loan approved in just 4 easy steps</p>
          
          <div className="process-steps">
            <div className="process-step">
              <div className="process-step-icon">
                <i className="fas fa-file-alt"></i>
              </div>
              <h3>Apply Online</h3>
              <p>Fill our simple online application form with basic details</p>
            </div>
            
            <div className="process-step">
              <div className="process-step-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <h3>Submit Documents</h3>
              <p>Upload necessary documents for verification</p>
            </div>
            
            <div className="process-step">
              <div className="process-step-icon">
                <i className="fas fa-clipboard-check"></i>
              </div>
              <h3>Get Approval</h3>
              <p>Receive in-principle approval within 24 hours</p>
            </div>
            
            <div className="process-step">
              <div className="process-step-icon">
                <i className="fas fa-money-bill-wave"></i>
              </div>
              <h3>Disbursement</h3>
              <p>Amount disbursed directly to builder/seller account</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="loans-cta-section">
        <div className="loans-container">
          <h2 className="loans-section-title">Ready to Own Your Dream Home?</h2>
          <p className="loans-section-subtitle">Apply for a home loan today and take the first step towards homeownership</p>
          <div className="loans-cta-buttons">
            <a href="/apply" className="loans-cta-button">Apply Now</a>
            <a href="/contact" className="loans-secondary-button">Speak to an Expert</a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ApnaLoansHome;