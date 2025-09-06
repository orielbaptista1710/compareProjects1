import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import './CustomerSignupPage.css'

const CustomerSignupPage = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const { data } = await API.post("/api/customers/customer-signup", form);
      localStorage.setItem("customerToken", data.token);
      localStorage.setItem("customer", JSON.stringify(data.customer));
      navigate("/customer-dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit}>
        <h2>Customer Sign Up</h2>
        <input name="name" placeholder="Name" onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
        <input name="phone" placeholder="Phone" onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
        <button type="submit">Sign Up</button>
        {error && <p className="error">{error}</p>}

        <p>
          Already have an account?{" "}
          <span className="auth-link" onClick={() => navigate("/customer-login")}>
            Login
          </span>
        </p>
      </form>
    </div>
  );
};

export default CustomerSignupPage;
