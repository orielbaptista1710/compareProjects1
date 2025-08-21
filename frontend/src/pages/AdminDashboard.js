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
  const [success, setSuccess] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [currentPropertyId, setCurrentPropertyId] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Add the renderMedia function
  const renderMedia = (media, isCover = false) => {
    if (!media) return null;

    if (isCover) {
      return (
        <div className="property-cover">
          <img 
            src={`${API_BASE_URL}${media}`} 
            alt="Cover" 
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/placeholder-cover.jpg';
            }}
          />
        </div>
      );
    }

    if (Array.isArray(media)) {
      return (
        <div className="media-grid">
          {media.map((item, index) => {
            const src = typeof item === 'object' ? item.src : item;
            const isVideo = typeof item === 'object' ? item.type === 'video' : 
                          src.includes('.mp4') || src.includes('.mov');

            return (
              <div key={index} className="media-item">
                {isVideo ? (
                  <video controls>
                    <source src={`${API_BASE_URL}${src}`} type={`video/${src.split('.').pop()}`} />
                  </video>
                ) : (
                  <img 
                    src={`${API_BASE_URL}${src}`} 
                    alt={`Media ${index}`}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder-image.jpg';
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      );
    }

    return null;
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

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

  const handleApprove = async (propertyId) => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/admin/approve/${propertyId}`, 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPendingProperties(prev => prev.filter(p => p._id !== propertyId));
      setAllProperties(prev => prev.map(p => 
        p._id === propertyId ? { ...p, status: 'approved' } : p
      ));
      setSuccess('Property approved successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve property');
      if (err.response?.status === 401) navigate('/login');
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
        { rejectionReason },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setPendingProperties(prev => prev.filter(p => p._id !== currentPropertyId));
      setAllProperties(prev => prev.map(p => 
        p._id === currentPropertyId ? { 
          ...p, 
          status: 'rejected',
          rejectionReason 
        } : p
      ));
      
      setShowRejectModal(false);
      setRejectionReason('');
      setError('');
      alert(data.message);
    } catch (err) {
      console.error('Rejection error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to reject property');
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

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

      {loading ? (
        <p className="loading-message">Loading properties...</p>
      ) : activeTab === 'pending' ? (
        <div className="properties-list">
          {pendingProperties.length === 0 ? (
            <p className="no-properties">No properties pending approval</p>
          ) : (
            pendingProperties.map(property => (
              <div key={property._id} className="property-card">
                <h3>{property.title}</h3>
                <p><strong>Submitted by:</strong> {property.userId?.displayName || 'Unknown'}</p>
                
                {/* Cover Image */}
                {property.coverImage && renderMedia(property.coverImage, true)}
                
                <p><strong>Location:</strong> {property.state}, {property.city}, {property.locality}</p>
                <p><strong>Address:</strong> {property.address || 'N/A'}</p>
                <p><strong>Description:</strong> {property.description || 'N/A'}</p>
                <p><strong>Details:</strong> {property.long_description || 'N/A'}</p>
                <p><strong>Possession Status:</strong> {property.possessionStatus || 'N/A'}</p>
                <p><strong>Agent:</strong> {property.firstName || 'N/A'}</p>
                <p><strong>Pincode:</strong> {property.pincode || 'N/A'}</p>
                <p><strong>Price:</strong> {property.price || 'N/A'}</p>
                <p><strong>Floor No:</strong> {property.floor || 'N/A'}</p>
                <p><strong>Total No. of Floors:</strong> {property.totalFloors || 'N/A'}</p>
                <p><strong>Property Age:</strong> {property.ageOfProperty || 'N/A'}</p>
                <p><strong>Parkings:</strong> {property.parkings || 'N/A'}</p>
                <p><strong>Facing:</strong> {property.facing || 'N/A'}</p>
                <p><strong>BHK:</strong> {property.bhk || 'N/A'}</p>
                <p><strong>Bathrooms:</strong> {property.bathrooms || 'N/A'}</p>
                <p><strong>Balconies:</strong> {property.balconies || 'N/A'}</p>
                <p><strong>Furnishing:</strong> {property.furnishing || 'N/A'}</p>
                <p><strong>Property Type:</strong> {property.propertyType || 'N/A'}</p>
                <p><strong>Featured:</strong> {property.featured ? 'Yes' : 'No'}</p>
                <p><strong>Amenities:</strong>{property.amenities}</p>
                
                {/* Gallery Images */}
                {property.galleryImages?.length > 0 && (
                  <div className="media-section">
                    <h4>Gallery Images ({property.galleryImages.length})</h4>
                    {renderMedia(property.galleryImages)}
                  </div>
                )}

                {/* Floor Plans */}
                {property.floorplanImages?.length > 0 && (
                  <div className="media-section">
                    <h4>Floor Plans ({property.floorplanImages.length})</h4>
                    {renderMedia(property.floorplanImages)}
                  </div>
                )}

                {/* Media Files */}
                {property.mediaFiles?.length > 0 && (
                  <div className="media-section">
                    <h4>Media Files ({property.mediaFiles.length})</h4>
                    {renderMedia(property.mediaFiles)}
                  </div>
                )}

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
                <p><strong>Developer:</strong> {property.firstName || 'N/A'}</p>
                <p><strong>Location:</strong> {property.state}, {property.city}, {property.locality}</p>
                <p><strong>Address:</strong> {property.address || 'N/A'}</p>
                <p><strong>Description:</strong> {property.description || 'N/A'}</p>
                <p><strong>Details:</strong> {property.long_description || 'N/A'}</p>
                <p><strong>Possession Status:</strong> {property.possessionStatus || 'N/A'}</p>
                <p><strong>Pincode:</strong> {property.pincode || 'N/A'}</p>
                <p><strong>Price:</strong> {property.price || 'N/A'}</p>
                <p><strong>Floor No:</strong> {property.floor || 'N/A'}</p>
                <p><strong>Total No. of Floors:</strong> {property.totalFloors || 'N/A'}</p>
                <p><strong>Property Age:</strong> {property.ageOfProperty || 'N/A'}</p>
                <p><strong>Parkings:</strong> {property.parkings || 'N/A'}</p>
                <p><strong>Facing:</strong> {property.facing || 'N/A'}</p>
                <p><strong>BHK:</strong> {property.bhk || 'N/A'}</p>
                <p><strong>Bathrooms:</strong> {property.bathrooms || 'N/A'}</p>
                <p><strong>Balconies:</strong> {property.balconies || 'N/A'}</p>
                <p><strong>Furnishing:</strong> {property.furnishing || 'N/A'}</p>
                <p><strong>Property Type:</strong> {property.propertyType || 'N/A'}</p>
                <p><strong>Amenities:</strong> {property.amenities || 'N/A'}</p>
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
