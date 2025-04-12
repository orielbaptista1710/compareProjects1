import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import './Dashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Dashboard = () => {
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem('token') || '', []);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    location: '',
    description: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);

  // Fetch user data
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data.user;
    },
    enabled: !!token,
    staleTime: 60 * 60 * 1000 // Cache for 1 hour
  });

  // Redirect unauthenticated user
  useEffect(() => {
    if (!token) navigate('/login');
  }, [token, navigate]);

  // Clear messages after 5s
  useEffect(() => {
    const timer = setTimeout(() => {
      setError('');
      setSuccess('');
    }, 5000);
    return () => clearTimeout(timer);
  }, [error, success]);

  // Logout
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    queryClient.removeQueries(['my-properties']);
    queryClient.removeQueries(['current-user']);
    navigate('/login');
  }, [navigate, queryClient]);

  // Fetch properties using React Query
  const {
    data: properties = [],
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['my-properties'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/api/properties/my-properties`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!Array.isArray(res.data)) {
        throw new Error('Invalid response format');
      }
      return res.data;
    },
    enabled: !!token,
    onError: (err) => {
      const status = err?.response?.status;
      setError(err?.response?.data?.message || 'Failed to fetch properties');
      if (status === 401 || status === 403) handleLogout();
    }
  });

  // Add property mutation
  const { mutate: addProperty, isPending: isAdding } = useMutation({
    mutationFn: (newProperty) =>
      axios.post(`${API_BASE_URL}/api/properties/add`, newProperty, {
        headers: { Authorization: `Bearer ${token}` }
      }),
    onSuccess: () => {
      setFormData({ title: '', location: '', description: '' });
      setSuccess('Property added successfully');
      setEditingId(null);
      refetch();
    },
    onError: (err) => {
      const status = err?.response?.status;
      setError(err?.response?.data?.message || 'Failed to add property');
      if (status === 401 || status === 403) handleLogout();
    }
  });

  // Update property mutation
  const { mutate: updateProperty, isPending: isUpdating } = useMutation({
    mutationFn: (updatedProperty) =>
      axios.put(`${API_BASE_URL}/api/properties/update/${editingId}`, updatedProperty, {
        headers: { Authorization: `Bearer ${token}` }
      }),
    onSuccess: () => {
      setFormData({ title: '', location: '', description: '' });
      setSuccess('Property updated successfully');
      setEditingId(null);
      refetch();
    },
    onError: (err) => {
      const status = err?.response?.status;
      setError(err?.response?.data?.message || 'Failed to update property');
      if (status === 401 || status === 403) handleLogout();
    }
  });

  const {mutate:deleteProperty} = useMutation({
    mutationFn: (propertyId) =>
      axios.delete(`${API_BASE_URL}/api/properties/delete/${propertyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
    onSuccess: () => {
      setSuccess('Property deleted successfully');
      refetch();
    },
    onError: (err) => {
      const status = err?.response?.status;
      setError(err?.response?.data?.message || 'Failed to delete property');
      if (status === 401 || status === 403) handleLogout();
    }
  });

  const handleDelete = (propertyId) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      deleteProperty(propertyId);
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.location) {
      setError('Title and location are required');
      return;
    }
    
    if (editingId) {
      updateProperty(formData);
    } else {
      addProperty(formData);
    }
  };

  // Start editing a property
  const handleEdit = (property) => {
    setEditingId(property._id);
    setFormData({
      title: property.title,
      location: property.location,
      description: property.description || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ title: '', location: '', description: '' });
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className="dashboard-title">
          {editingId ? 'Edit Property' : 'Add Property'}
        </h2>
        <div className="user-info">
          <span className="welcome-message">
            Welcome, {user?.displayName || 'User'}
          </span>
          <button className="logout-button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      <form className="form-group" onSubmit={handleSubmit}>
        <input
          className="form-input"
          name="title"
          placeholder="Title"
          value={formData.title}
          onChange={handleChange}
          required
        />
        <input
          className="form-input"
          name="location"
          placeholder="Location"
          value={formData.location}
          onChange={handleChange}
          required
        />
        <input
          className="form-input"
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
        />
        <div className="form-buttons">
          <button 
            className="submit-button" 
            type="submit" 
            disabled={isAdding || isUpdating}
          >
            {isAdding || isUpdating 
              ? (isAdding ? 'Submitting...' : 'Updating...') 
              : (editingId ? 'Update Property' : 'Add Property')}
          </button>
          {editingId && (
            <button 
              type="button" 
              className="cancel-button"
              onClick={handleCancelEdit}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <h2 className="properties-title">My Properties</h2>

      {isLoading ? (
        <div>Loading properties...</div>
      ) : isError ? (
        <div className="error">Error loading properties</div>
      ) : properties.length > 0 ? (
        <div className="properties-grid">
          {properties.map((p) => (
            <div className="property-card" key={p._id}>
              <h4 className="property-title">{p.title}</h4>
              <p className="property-location">{p.location}</p>
              <p className="property-description">{p.description}</p>

              <div className="property-status" style={{
        color: p.status === 'approved' ? 'green' : 
               p.status === 'rejected' ? 'red' : 'orange'
      }}>
        Status: {p.status}
        {p.status === 'rejected' && p.rejectionReason && (
          <div>Reason: {p.rejectionReason}</div>
        )}
      </div>

              <div className="property-actions">
                <button 
                  className="edit-button"
                  onClick={() => handleEdit(p)}
                >
                  Edit
                </button>
                <button 
                  className="delete-button"
                  onClick={() => handleDelete(p._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">No properties found</div>
      )}
    </div>
  );
};

export default Dashboard;