// src/pages/CustomerDashboard.js
import React, { useEffect, useState } from 'react';
import API from '../api';
import './CustomerSignupPage.css'

const CustomerProfilePage = () => {
  const [customer, setCustomer] = useState(() => {
    const raw = localStorage.getItem('customerData');
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    // optional: refresh data from /me
    const fetchMe = async () => {
      try {
        const token = localStorage.getItem('customerToken');
        const { data } = await API.get('/api/customers/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCustomer(data.customer);
        localStorage.setItem('customerData', JSON.stringify(data.customer));
      } catch (err) {
        console.warn('Cannot refresh customer data', err);
      }
    };
    fetchMe();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerData');
    window.location.href = '/'; // or use navigate
  };

  return (
    <div className='auth-container'>
      <h1>Welcome, {customer?.name || 'Customer'}</h1>

      <h1>Hellloeo vksvnl</h1>
      <p>Email: {customer?.email}</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default CustomerProfilePage;
