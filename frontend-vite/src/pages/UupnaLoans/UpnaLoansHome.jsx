import React, { useState, useEffect, useCallback } from 'react';
import './UpnaLoansHome.css';
import EMICalculatorWidget from '../../utils/EMICalculatorWidget';
import Seo from '../../database/Seo';

const UpnaLoansHome = () => { 
  const [loanAmount, setLoanAmount] = useState(2500000);
  const [interestRate, setInterestRate] = useState(8.4);
  const [loanTenure, setLoanTenure] = useState(20);
  const [emi, setEmi] = useState(21490);
  const [totalInterest, setTotalInterest] = useState(2657600);
  const [totalAmount, setTotalAmount] = useState(5157600);
  const [activeTab, setActiveTab] = useState('home-loan');

  const calculateEMI = useCallback(() => {
    const principal = loanAmount;
    const monthlyInterest = interestRate / 12 / 100;
    const numberOfPayments = loanTenure * 12;
    
    if (monthlyInterest === 0) {
      const emiValue = principal / numberOfPayments;
      setEmi(Math.round(emiValue));
      setTotalAmount(principal);
      setTotalInterest(0);
      return;
    }
    
    const emiValue = principal * monthlyInterest * Math.pow(1 + monthlyInterest, numberOfPayments) / 
                    (Math.pow(1 + monthlyInterest, numberOfPayments) - 1);
    const totalAmountValue = emiValue * numberOfPayments;
    const totalInterestValue = totalAmountValue - principal;
    
    setEmi(Math.round(emiValue));
    setTotalAmount(Math.round(totalAmountValue));
    setTotalInterest(Math.round(totalInterestValue));
  }, [loanAmount, interestRate, loanTenure]);

  useEffect(() => {
    calculateEMI();
  }, [calculateEMI]);

  const formatCurrency = (amount) => {      //CHECK THIS is it linked to mongodb dunamically
    return '₹' + amount.toLocaleString('en-IN');
  };
//CHECK THIS is it linked to mongodb dunamically
  const formatCompactCurrency = (amount) => {
    if (amount >= 10000000) return '₹' + (amount / 10000000).toFixed(1) + 'Cr';
    if (amount >= 100000) return '₹' + (amount / 100000).toFixed(1) + 'L';
    return formatCurrency(amount);
  };

  const loanProducts = [
    {
      id: 'home-loan',
      title: 'Regular Home Loan',
      description: 'Standard home loan for ready-to-move-in properties',
      features: [
        'Up to ₹5 Crores',
        'Interest from 8.4% p.a.',
        'Tenure up to 30 years',
        '90% of property value'
      ],
      icon: '🏠'
    },
    {
      id: 'construction-loan',
      title: 'Home Construction Loan',
      description: 'Finance for constructing your dream home',
      features: [
        'Up to ₹3 Crores',
        'Interest from 8.7% p.a.',
        'Tenure up to 25 years',
        'Disbursed in stages'
      ],
      icon: '🏗️'
    },
    {
      id: 'extension-loan',
      title: 'Home Extension Loan',
      description: 'Expand or renovate your existing home',
      features: [
        'Up to ₹1 Crore',
        'Interest from 9.2% p.a.',
        'Tenure up to 20 years',
        'Quick approval process'
      ],
      icon: '🔨'
    },
    {
      id: 'balance-transfer',
      title: 'Balance Transfer',
      description: 'Transfer your existing home loan to save more',
      features: [
        'Lower interest rates',
        'Top-up loan available',
        'Zero processing fee*',
        'Save up to ₹5 lakhs'
      ],
      icon: '🔄'
    }
  ];

  const stats = [
    { value: '50,000+', label: 'Happy Customers' },
    { value: '₹5000Cr+', label: 'Loan Disbursed' },
    { value: '98%', label: 'Approval Rate' },
    { value: '24/7', label: 'Support' }
  ];

  const steps = [
    {
      title: 'Check Eligibility',
      description: 'Use our calculator to check your loan eligibility instantly',
      icon: '📊'
    },
    {
      title: 'Upload Documents',
      description: 'Submit required documents online - quick and secure',
      icon: '📄'
    },
    {
      title: 'Get Approval',
      description: 'Receive instant sanction letter within 24 hours',
      icon: '✅'
    },
    {
      title: 'Receive Funds',
      description: 'Get your loan disbursed directly to your account',
      icon: '💰'
    }
  ];

  return (
    <div className="upna-loans-page">
      <Seo 
        title="Upna Loans & Finance | CompareProjects" 
        description="Explore property loan options and financial advice to buy your dream home. Compare interest rates, eligibility, and apply for home loans seamlessly with CompareProjects."  
      />
      
      {/* Hero Section */}
      <section className="upna-hero-section">
        <div className="upna-container">
          <div className="upna-hero-grid">
            <div className="upna-hero-content">
              <div className="upna-hero-badge">
                <span>🏆 India's Most Trusted Home Loan Provider</span>
              </div>
              <h1 className="upna-hero-title">
                Your Dream Home is Just a <span className="upna-highlight">Loan Away</span>
              </h1>
              <p className="upna-hero-subtitle">
                Lowest interest rates starting at 8.4%, instant online approval, and flexible repayment options tailored for you
              </p>
              <div className="upna-hero-features">
                <div className="upna-feature-tag">⚡ Instant Approval</div>
                <div className="upna-feature-tag">💰 Lowest Rates</div>
                <div className="upna-feature-tag">🛡️ Zero Hidden Charges</div>
              </div>
              <div className="upna-hero-actions">
                <a href="#calculator" className="upna-btn upna-btn-primary">
                  Check Eligibility →
                </a>
                <a href="#loan-types" className="upna-btn upna-btn-outline">
                  View Loan Options
                </a>
              </div>
            </div>
            <div className="upna-hero-calculator">
              <EMICalculatorWidget 
                loanAmount={loanAmount}
                interestRate={interestRate}
                loanTenure={loanTenure}
                onLoanAmountChange={setLoanAmount}
                onInterestRateChange={setInterestRate}
                onLoanTenureChange={setLoanTenure}
                emi={emi}
                totalAmount={totalAmount}
                totalInterest={totalInterest}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="upna-stats-section">
        <div className="upna-container">
          <div className="upna-stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="upna-stat-card">
                <div className="upna-stat-value">{stat.value}</div>
                <div className="upna-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="upna-process-section">
        <div className="upna-container">
          <div className="upna-section-header">
            <span className="upna-section-badge">PROCESS</span>
            <h2 className="upna-section-title">Simple Steps to Your Dream Home</h2>
            <p className="upna-section-subtitle">
              Get your home loan approved in just 4 easy steps
            </p>
          </div>
          <div className="upna-steps-grid">
            {steps.map((step, index) => (
              <div key={index} className="upna-step-card">
                <div className="upna-step-icon">{step.icon}</div>
                <div className="upna-step-number">Step {index + 1}</div>
                <h3 className="upna-step-title">{step.title}</h3>
                <p className="upna-step-description">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EMI Calculator Section */}
      <section id="calculator" className="upna-calculator-section">
        <div className="upna-container">
          <div className="upna-section-header">
            <span className="upna-section-badge">CALCULATOR</span>
            <h2 className="upna-section-title">Calculate Your EMI</h2>
            <p className="upna-section-subtitle">
              Plan your home loan with our smart calculator
            </p>
          </div>
          
          <div className="upna-calculator-grid">
            <div className="upna-calculator-controls">
              <div className="upna-form-group">
                <div className="upna-input-header">
                  <label>Loan Amount</label>
                  <span className="upna-input-value">{formatCurrency(loanAmount)}</span>
                </div>
                <input 
                  type="range" 
                  className="upna-range-slider" 
                  min="500000" 
                  max="5000000" 
                  step="50000" 
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(parseInt(e.target.value))}
                />
                <div className="upna-range-labels">
                  <span>₹5L</span>
                  <span>₹50L</span>
                </div>
              </div>
              
              <div className="upna-form-group">
                <div className="upna-input-header">
                  <label>Interest Rate</label>
                  <span className="upna-input-value">{interestRate}% p.a.</span>
                </div>
                <input 
                  type="range" 
                  className="upna-range-slider" 
                  min="6.5" 
                  max="15" 
                  step="0.1" 
                  value={interestRate}
                  onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                />
                <div className="upna-range-labels">
                  <span>6.5%</span>
                  <span>15%</span>
                </div>
              </div>
              
              <div className="upna-form-group">
                <div className="upna-input-header">
                  <label>Loan Tenure</label>
                  <span className="upna-input-value">{loanTenure} Years</span>
                </div>
                <input 
                  type="range" 
                  className="upna-range-slider" 
                  min="1" 
                  max="30" 
                  value={loanTenure}
                  onChange={(e) => setLoanTenure(parseInt(e.target.value))}
                />
                <div className="upna-range-labels">
                  <span>1 Year</span>
                  <span>30 Years</span>
                </div>
              </div>
            </div>
            
            <div className="upna-calculator-result">
              <div className="upna-result-header">
                <span className="upna-result-label">Monthly EMI</span>
                <div className="upna-result-amount">{formatCurrency(emi)}</div>
              </div>
              <div className="upna-result-breakdown">
                <div className="upna-breakdown-row">
                  <span>Principal Amount</span>
                  <span className="upna-breakdown-value">{formatCompactCurrency(loanAmount)}</span>
                </div>
                <div className="upna-breakdown-row">
                  <span>Total Interest</span>
                  <span className="upna-breakdown-value">{formatCompactCurrency(totalInterest)}</span>
                </div>
                <div className="upna-breakdown-row upna-breakdown-total">
                  <span>Total Amount</span>
                  <span className="upna-breakdown-value">{formatCompactCurrency(totalAmount)}</span>
                </div>
              </div>
              <button className="upna-result-btn">Apply for this Loan →</button>
            </div>
          </div>
        </div>
      </section>

      {/* Loan Types Section */}
      <section id="loan-types" className="upna-loans-section">
        <div className="upna-container">
          <div className="upna-section-header">
            <span className="upna-section-badge">PRODUCTS</span>
            <h2 className="upna-section-title">Choose Your Loan Type</h2>
            <p className="upna-section-subtitle">
              Tailored solutions for every home financing need
            </p>
          </div>
          
          <div className="upna-loans-grid">
            {loanProducts.map(product => (
              <div 
                key={product.id} 
                className={`upna-loan-card ${activeTab === product.id ? 'upna-card-active' : ''}`}
                onClick={() => setActiveTab(product.id)}
              >
                <div className="upna-card-icon">{product.icon}</div>
                <h3 className="upna-card-title">{product.title}</h3>
                <p className="upna-card-description">{product.description}</p>
                <ul className="upna-card-features">
                  {product.features.map((feature, index) => (
                    <li key={index}>
                      <span className="upna-feature-check">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <a href={`/${product.id}`} className="upna-card-link">
                  Learn More →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="upna-cta-section">
        <div className="upna-container">
          <div className="upna-cta-content">
            <h2 className="upna-cta-title">Ready to Get Started?</h2>
            <p className="upna-cta-subtitle">
              Join 50,000+ satisfied customers who've made their dream home a reality
            </p>
            <div className="upna-cta-actions">
              <a href="/apply" className="upna-btn upna-btn-primary upna-btn-large">
                Apply Now - Get Instant Approval
              </a>
              <a href="/contact" className="upna-btn upna-btn-outline upna-btn-large">
                📞 Speak to an Expert
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default UpnaLoansHome;