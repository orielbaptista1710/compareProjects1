import React, { useState, useEffect, useCallback } from 'react';
import './UpnaLoansHome.css';
import HeroSection from '../Home/HomePageComponents/HeroSection';
import EMICalculatorWidget from '../../utils/EMICalculatorWidget';
import Seo from '../../database/Seo';
const UpnaLoansHome = () => {
  const [loanAmount, setLoanAmount] = useState(2500000);
  const [interestRate, setInterestRate] = useState(8.4);
  const [loanTenure, setLoanTenure] = useState(20);
  const [emi, setEmi] = useState(21490);
  const [totalInterest, setTotalInterest] = useState(2657600);
  const [totalAmount, setTotalAmount] = useState(5157600);
  // const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home-loan');

  // Optimized EMI calculation with useCallback
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

  const formatCurrency = (amount) => {
    return '₹' + amount.toLocaleString('en-IN');
  };

  const formatCompactCurrency = (amount) => {
    if (amount >= 10000000) return '₹' + (amount / 10000000).toFixed(1) + 'Cr';
    if (amount >= 100000) return '₹' + (amount / 100000).toFixed(1) + 'L';
    return formatCurrency(amount);
  };

  // Loan products data
  const loanProducts = [
    {
      id: 'home-loan',
      title: 'Regular Home Loan',
      description: 'Standard home loan for ready-to-move-in properties',
      features: [
        'Up to ₹5 Crores',
        'Interest from 8.4% p.a.',
        'Tenure up to 30 years',
        '90% of property value',
        'Quick processing within 72 hours'
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
        'Disbursed in stages',
        'Technical assistance included'
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
        'Quick approval process',
        'Minimal documentation'
      ],
      icon: '🔨'
    },
    {
      id: 'balance-transfer',
      title: 'Home Loan Balance Transfer',
      description: 'Transfer your existing home loan to save more',
      features: [
        'Lower interest rates',
        'Top-up loan available',
        'Zero processing fee*',
        'Seamless transfer process',
        'Save up to ₹5 lakhs'
      ],
      icon: '🔄'
    }
  ];

  const stats = [
    { value: '50,000+', label: 'Happy Customers' },
    { value: '₹5000Cr+', label: 'Loan Disbursed' },
    { value: '98%', label: 'Approval Rate' },
    { value: '24/7', label: 'Customer Support' }
  ];

  return (
    <div className="apna-loans-page">

      <Seo 
      title="Apna Loans & Finance | CompareProjects" 
      description="Explore property loan options and financial advice to buy your dream home. Compare interest rates, eligibility, and apply for home loans seamlessly with CompareProjects."  
      />
      {/* Hero Section */}
      <section className="loans-hero">
        <div className="loans-container">
          <div className="loans-hero-content">
            <div className="hero-badge">
              <span>🏆 India's Most Trusted Home Loan Provider</span>
            </div>
            <h1>Your Dream Home is Just a <span className="highlight">Loan Away</span></h1>
            <p>Lowest interest rates starting at 8.4%, instant online approval, and flexible repayment options tailored for you</p>
            <div className="hero-features">
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <span>Instant Approval</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💰</span>
                <span>Lowest Rates</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🛡️</span>
                <span>Zero Hidden Charges</span>
              </div>
            </div>
            <div className="hero-actions">
              <a href="#calculator" className="loans-cta-button primary">
                <span>Check Eligibility</span>
                <span className="icon">→</span>
              </a>
              <a href="#loan-types" className="loans-cta-button secondary">
                View Loan Options
              </a>
            </div>
          </div>
          <div className="hero-widget">
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
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="loans-container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="loans-process">
        <HeroSection />
      </section>

      {/* EMI Calculator Section */}
      <section id="calculator" className="loans-calculator">
        <div className="loans-container">
          <div className="loans-section-header">
            <h2 className="loans-section-title">Smart EMI Calculator</h2>
            <p className="loans-section-subtitle">Plan your home loan with our advanced EMI calculator. Adjust parameters to find your perfect payment plan.</p>
          </div>
          
          <div className="calculator-container">
            <div className="calculator-form">
              <div className="form-group">
                <div className="input-header">
                  <label htmlFor="loan-amount">Loan Amount</label>
                  <span className="input-value">{formatCurrency(loanAmount)}</span>
                </div>
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
                <div className="range-labels">
                  <span>₹5L</span>
                  <span>₹50L</span>
                </div>
              </div>
              
              <div className="form-group">
                <div className="input-header">
                  <label htmlFor="interest-rate">Interest Rate</label>
                  <span className="input-value">{interestRate}% p.a.</span>
                </div>
                <input 
                  type="range" 
                  id="interest-rate" 
                  className="range-slider" 
                  min="6.5" 
                  max="15" 
                  step="0.1" 
                  value={interestRate}
                  onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                />
                <div className="range-labels">
                  <span>6.5%</span>
                  <span>15%</span>
                </div>
              </div>
              
              <div className="form-group">
                <div className="input-header">
                  <label htmlFor="loan-tenure">Loan Tenure</label>
                  <span className="input-value">{loanTenure} Years</span>
                </div>
                <input 
                  type="range" 
                  id="loan-tenure" 
                  className="range-slider" 
                  min="1" 
                  max="30" 
                  value={loanTenure}
                  onChange={(e) => setLoanTenure(parseInt(e.target.value))}
                />
                <div className="range-labels">
                  <span>1 Year</span>
                  <span>30 Years</span>
                </div>
              </div>
            </div>
            
            <div className="calculator-result">
              <div className="result-card">
                <h3>Your Monthly EMI</h3>
                <div className="result-amount">{formatCurrency(emi)}</div>
                <div className="result-breakdown">
                  <div className="breakdown-item">
                    <span className="label">Total Interest</span>
                    <span className="value">{formatCompactCurrency(totalInterest)}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="label">Total Amount</span>
                    <span className="value">{formatCompactCurrency(totalAmount)}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="label">Principal Amount</span>
                    <span className="value">{formatCompactCurrency(loanAmount)}</span>
                  </div>
                </div>
                <div className="result-actions">
                  <button className="action-btn primary">Apply for this Loan</button>
                  <button className="action-btn secondary">Download Calculation</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Loan Types Section */}
      <section id="loan-types" className="loans-types">
        <div className="loans-container">
          <div className="loans-section-header">
            <h2 className="loans-section-title">Tailored Home Loan Solutions</h2>
            <p className="loans-section-subtitle">Choose from our comprehensive range of home loan products designed for every need and budget</p>
          </div>
          
          <div className="loans-tabs">
            {loanProducts.map(product => (
              <button
                key={product.id}
                className={`tab-button ${activeTab === product.id ? 'active' : ''}`}
                onClick={() => setActiveTab(product.id)}
              >
                <span className="tab-icon">{product.icon}</span>
                {product.title}
              </button>
            ))}
          </div>
          
          <div className="loans-cards">
            {loanProducts.map(product => (
              <div 
                key={product.id} 
                className={`loans-card ${activeTab === product.id ? 'active' : ''}`}
              >
                <div className="loans-card-header">
                  <div className="card-icon">{product.icon}</div>
                  <h3>{product.title}</h3>
                </div>
                <div className="loans-card-body">
                  <p className="loans-card-description">{product.description}</p>
                  <ul className="loans-features">
                    {product.features.map((feature, index) => (
                      <li key={index}>
                        <i className="fas fa-check-circle"></i>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="card-actions">
                    <a href={`/${product.id}`} className="loans-cta-button">
                      Apply Now
                    </a>
                    <a href={`/${product.id}#details`} className="link-button">
                      Learn More →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="loans-cta-section">
        <div className="loans-container">
          <div className="cta-content">
            <h2 className="loans-section-title">Ready to Begin Your Home Ownership Journey?</h2>
            <p className="loans-section-subtitle">Join 50,000+ satisfied customers who've made their dream home a reality with Apna Loans</p>
            <div className="loans-cta-buttons">
              <a href="/apply" className="loans-cta-button primary">
                <span>Apply Now - Get Instant Approval</span>
              </a>
              <a href="/contact" className="loans-cta-button secondary">
                <span>📞 Speak to a Loan Expert</span>
              </a>
            </div>
            <div className="cta-features">
              <div className="feature">
                <span className="feature-icon">✅</span>
                <span>100% Digital Process</span>
              </div>
              <div className="feature">
                <span className="feature-icon">✅</span>
                <span>Lowest Interest Rates</span>
              </div>
              <div className="feature">
                <span className="feature-icon">✅</span>
                <span>Instant Sanction Letter</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default UpnaLoansHome;