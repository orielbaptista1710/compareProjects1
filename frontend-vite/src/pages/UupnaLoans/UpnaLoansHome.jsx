import "./UpnaLoansHome.css";

const UpnaLoansHome = () => {
  return (
    <div className="home">
      <section className="hero">
        <h1>Simple Dummy Loans. Fast Approval.</h1>
        <p>
          Get personal and business loans with a quick, secure, and
          hassle-free process.
        </p>
        <button className="primary-btn">Apply Now</button>
      </section>

      <section className="features">
        <div className="card">
          <h3>Quick Approval</h3>
          <p>Loan decisions in minutes.</p>
        </div>
        <div className="card">
          <h3>Low Interest</h3>
          <p>Affordable rates for every borrower.</p>
        </div>
        <div className="card">
          <h3>100% Secure</h3>
          <p>Your data is protected at every step.</p>
        </div>
      </section>

    </div>
  );
}

export default UpnaLoansHome;