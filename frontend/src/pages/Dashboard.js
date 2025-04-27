import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import './Dashboard.css';
import SellPropertyForm from '../components/SellPropertyForm';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;


const Dashboard = () => {
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem('token') || '', []);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    // Contact Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  
    // Property Information
    title: '',
    description: '',
    long_description: '',
  
    // Location Details
    location: '',
    state: '',
    city: '',
    locality: '',
    address: '',
    pincode: '',
    landmarks: [],

    price: '',

    //property details
    propertyType: '',
    furnishing: '',
    possessionStatus: '',

    bhk: '',
    bathrooms: '',
    balconies: '',
    facing: '',
    parkings: [],

    ageOfProperty: '',
    totalFloors: '',
    floor: '',
    // availableForm:

    
  });


  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);

  // Fetch user data
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        return res.data.user;
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
        throw error;
      }
    },
    enabled: !!token,
    staleTime: 60 * 60 * 1000
  });

  // Redirect unauthenticated user
  useEffect(() => {
    console.log('Current token:', token);
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

  // Fetch properties
  const {
    data: properties = [],
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['my-properties'],
    queryFn: async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/properties/my-properties`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!Array.isArray(res.data)) {
          throw new Error('Invalid response format');
        }
        return res.data;
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
        throw error;
      }
    },
    enabled: !!token,
    onError: (err) => {
      const status = err?.response?.status;
      setError(err?.response?.data?.message || 'Failed to fetch properties');
      if (status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    }
  });

  // Add property mutation
  const { mutate: addProperty, isPending: isAdding } = useMutation({
    
    mutationFn: (newProperty) =>
      axios.post(`${API_BASE_URL}/api/properties/add`, newProperty, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      

    onSuccess: () => {
      setFormData({ title: '', location: '', description: '', long_description: '', city: '', locality: '',
                    address: '', pincode: ''}); // what does this do i forgot
      setSuccess('Property added successfully');
      setEditingId(null);
      refetch();
    },
    onError: (err) => {
      console.error('Full error:', err);
      console.error('Response data:', err.response?.data);
      const status = err?.response?.status;
      const message = err.response?.data?.message || 
                     err.response?.data?.error || 
                     'Failed to add property';
      setError(message);
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

  // Delete property mutation
  const { mutate: deleteProperty } = useMutation({
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
  };

  const handleChange = (e) => {
    console.log('Field changed:', e.target.name, 'New value:', e.target.value);
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (formData) => {
  const requiredFields = [
    'title', 'description', 
    'city', 'locality', 'address', 'pincode',
    'propertyType', 'furnishing', 'possessionStatus', 'price',
  ];
  
  const missingFields = requiredFields.filter(field => !formData[field]);
  
  if (missingFields.length > 0) {
    setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
    return;
  }
    
    if (editingId) {
      updateProperty(formData);
    } else {
      addProperty(formData);
    }
  };

  const handleEdit = (property) => {

    console.log('Editing property:', property);

    setEditingId(property._id);
    setFormData({
      firstName: property.firstName || '',
      title: property.title || '',
      description: property.description || '',
      long_description: property.long_description || '',
      location: property.location || '',
      state: property.state || '',
      city: property.city || '',
      locality: property.locality || '',
      address: property.address || '',
      pincode: property.pincode || '',
      propertyType: property.propertyType || '',
      furnishing: property.furnishing || [],
      possessionStatus: property.possessionStatus || [],
      bhk: property.bhk || '',
      bathrooms:property.bathrooms || '',
      balconies:property.balconies || '',
      facing:property.facing || '',
      parkings: Array.isArray(property.parkings) ? property.parkings : (property.parkings ? [property.parkings] : []),
      landmarks: Array.isArray(property.landmarks) ? property.landmarks : [],
      price: property.price || '',
      ageOfProperty:property.ageOfProperty || "New",
      totalFloors:property.totalFloors || '',
      floor:property.floor || '',
    });
      setTimeout(() => {
        console.log('Form data after setting:', formData);
      }, 0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

  const handleCancelEdit = () => {
  setEditingId(null);
  setFormData({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    description: '',
    long_description: '',
    location: '',
    state: '',
    city: '',
    locality: '',
    address: '',
    pincode: '',
    landmarks: [],
    propertyType: '',
    furnishing: '',
    possessionStatus: '',
    bhk: '',
    bathrooms: '',
    balconies: '',
    facing: '',
    parkings: [],
    price: '',
    ageOfProperty:'',
    totalFloors:'',
    floor:'',
    
  });
};

console.log('Properties data:', properties);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Property Dashboard</h2>
        <div className="user-info">
          <span className="welcome-message">
            Welcome, {user?.displayName || 'User'}
          </span>
          <button className="logout-button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>

      <SellPropertyForm
        formData={formData}
        setFormData={setFormData}
        editingId={editingId}
        isAdding={isAdding}
        isUpdating={isUpdating}
        error={error}
        success={success}
        handleChange={handleChange}
        onSubmit={handleSubmit}
        handleCancelEdit={handleCancelEdit}

      />

      <h2 className="properties-title">My Properties</h2>

      {isLoading ? (
        <div>Loading properties...</div>
      ) : isError ? (
        <div className="error">Error loading properties</div>
      ) : properties.length > 0 ? (
        <div className="properties-grid">
  {properties.map((p) => (
    <div className="property-card" key={p._id}>
      <div className="property-header">
        <h4 className="property-title">{p.title}</h4>
        <div className="property-status" style={{
          color: p.status === 'approved' ? 'green' : 
                 p.status === 'rejected' ? 'red' : 'orange'
        }}>
          {p.status}
        </div>
      </div>

      <div className="property-details">
        <div className="detail-row">
          <span className="detail-label">Location:</span>
          <span>{p.state},{p.locality}, {p.city}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Address:</span>
          <span>{p.address},{p.pincode}</span>
        </div>
        <div className='detail-row'>
          <span className="detail-label">Landmarks:</span>
          <span>
            {p.landmarks && p.landmarks.length > 0 
              ? p.landmarks.join(', ') 
              : 'None listed'}
          </span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Property Type:</span>
          <span>{p.propertyType}</span>
        </div>
        <div className='detail-row'>
          <span className="detail-label">Furnishing:</span>
          <span>{p.furnishing}</span>
        </div>
        <div className='detail-row'>
          <span className="detail-label">Possession Status:</span>
          <span>{p.possessionStatus}</span>
        </div>

        <div className='detail-row'>
          <span className="detail-label">BHK/Bathrooms/Balconies:</span>
          <span>{p.bhk}/{p.bathrooms}/{p.balconies}</span>
        </div>
        <div className='detail-row'>
          <span className="detail-label">Facing:</span>
          <span>{p.facing}</span>
        </div>

        <div className='detail-row'>
          <span className="detail-label">Parking:</span>
          <span>{p.parkings}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Contact:</span>
          <span>{p.firstName} {p.lastName}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Price:</span>
          <span>{p.price}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Property Age:</span>
          <span>{p.ageOfProperty}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Total Floors:</span>
          <span>{p.totalFloors}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Floor No:</span>
          <span>{p.floor}</span>
        </div>

        

      </div>

      <div className="property-description">
        <h5>Description:</h5>
        <p>{p.description}</p>
        {p.long_description && (
          <>
            <h5>Details:</h5>
            <p>{p.long_description}</p>
          </>
        )}
      </div>

      {p.status === 'rejected' && p.rejectionReason && (
        <div className="property-rejection">
          <h5>Rejection Reason:</h5>
          <p>{p.rejectionReason}</p>
        </div>
      )}

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