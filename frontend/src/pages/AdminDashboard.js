import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;


const AdminDashboard = () => {
  const [pendingProperties, setPendingProperties] = useState([]);
  const [allProperties, setAllProperties] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [currentPropertyId, setCurrentPropertyId] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Fetch data based on active tab
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
        setLoading(true);
        try {
          const endpoint = activeTab === 'pending' 
            ? `${API_BASE_URL}/api/admin/pending-properties` 
            : `${API_BASE_URL}/api/admin/all-properties`;
          
          const { data } = await axios.get(endpoint, {
            headers: { Authorization: `Bearer ${token}` }
          });
  
          if (activeTab === 'pending') {
            setPendingProperties(data);
          } else {
            setAllProperties(data);
          }
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to fetch properties');
          if (err.response?.status === 401) navigate('/login');
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [activeTab, token, navigate]);
  
    // Update all your API calls to include the full URL:
    const handleApprove = async (propertyId) => {
      try {
        const { data } = await axios.put(
          `${API_BASE_URL}/api/admin/approve/${propertyId}`, 
          {}, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // ... rest of your approve logic
      } catch (err) {
        // ... error handling
      }
    };

  const openRejectModal = (propertyId) => {
    setCurrentPropertyId(propertyId);
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }
  
    try {
      const { data } = await axios.put(
        `${API_BASE_URL}/api/admin/reject/${currentPropertyId}`,
        { rejectionReason },  // Make sure this matches your backend expectation
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Update state
      setPendingProperties(prev => prev.filter(p => p._id !== currentPropertyId));
      setAllProperties(prev => prev.map(p => 
        p._id === currentPropertyId ? { 
          ...p, 
          status: 'rejected',
          rejectionReason 
        } : p
      ));
      
      // Reset modal
      setShowRejectModal(false);
      setRejectionReason('');
      setError('');
      alert(data.message);
    } catch (err) {
      console.error('Rejection error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to reject property');
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      {error && <div className="error-message">{error}</div>}

      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Approvals ({pendingProperties.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Properties
        </button>
      </div>

      {activeTab === 'pending' ? (
        <div className="properties-list">
          {pendingProperties.length === 0 ? (
            <p className="no-properties">No properties pending approval</p>
          ) : (
            pendingProperties.map(property => (
              <div key={property._id} className="property-card">
                <h3>{property.title}</h3>
                <p><strong>Location:</strong> {property.location}</p>
                <p><strong>Description:</strong> {property.description}</p>
                <p><strong>Submitted by:</strong> {property.userId?.displayName || 'Unknown'}</p>
                
                <div className="action-buttons">
                  <button 
                    className="approve-button"
                    onClick={() => handleApprove(property._id)}
                  >
                    Approve
                  </button>
                  <button 
                    className="reject-button"
                    onClick={() => openRejectModal(property._id)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="properties-list">
          {allProperties.length === 0 ? (
            <p className="no-properties">No properties found</p>
          ) : (
            allProperties.map(property => (
              <div key={property._id} className="property-card">
                <h3>{property.title}</h3>
                <p><strong>Location:</strong> {property.location}</p>
                <p><strong>Description:</strong> {property.description}</p>
                <p><strong>Status:</strong> 
                  <span className={`status-${property.status}`}>
                    {property.status}
                    {property.status === 'rejected' && property.rejectionReason && (
                      <span> - {property.rejectionReason}</span>
                    )}
                  </span>
                </p>
                <p><strong>Submitted by:</strong> {property.userId?.displayName || 'Unknown'}</p>
                {property.reviewedBy && (
                  <p><strong>Reviewed by:</strong> {property.reviewedBy?.displayName || 'Admin'}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {showRejectModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Reject Property</h3>
            <textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="modal-buttons">
              <button onClick={() => {
                setShowRejectModal(false);
                setRejectionReason('');
              }}>
                Cancel
              </button>
              <button 
                className="confirm-reject"
                onClick={handleReject}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;