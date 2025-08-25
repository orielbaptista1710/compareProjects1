import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import './Dashboard.css';
import SellPropertyForm from '../components/SellPropertyForm';
import DashboardNav from '../components/DashboardNav';
import API from '../api'; // Your axios instance

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('sell');
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
    state: '',
    city: '',
    locality: '',
    address: '',
    pincode: '',
    landmarks: [],

    area: {
      value: 0,
      unit: 'sqft'
    },

    reraApproved: false,
    reraNumber: '',

    priceNegotiable: false,
    price: '',

    // Property details
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

    unitsAvailable: '',
    availableFrom: null,

    coverImage: '',
    galleryImages: [],
    floorplanImages: [],
    mediaFiles: [],

    amenities: [],
    facilities: [],
    security: [],
  });

  // Format prices in Indian format
  const formatIndianPrice = useCallback((price) => {
    if (!price) return 'Price on Request';
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} Lakh`;
    return `₹${price.toLocaleString('en-IN')}`;
  }, []);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);

  // Fetch user data
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      try {
        const res = await API.get('/api/auth/me', {
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
        const res = await API.get('/api/properties/my-properties', {
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
      API.post('/api/properties/add', newProperty, {
        headers: { Authorization: `Bearer ${token}` }
      }),
    onSuccess: () => {
      setFormData({ 
        title: '',  
        description: '', 
        long_description: '', 
        city: '', 
        locality: '',
        address: '', 
        pincode: ''
      });
      setSuccess('Property added successfully');
      setEditingId(null);
      refetch();
      setActiveTab('properties'); // Switch to properties tab after success
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
      API.put(`/api/properties/update/${editingId}`, updatedProperty, {
        headers: { Authorization: `Bearer ${token}` }
      }),
    onSuccess: () => {
      setFormData({ 
        title: '', 
        description: '', 
        long_description: '', 
        city: '', 
        locality: '',
        address: '', 
        pincode: ''
      });
      setSuccess('Property updated successfully');
      setEditingId(null);
      refetch();
      setActiveTab('properties'); // Switch to properties tab after success
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
      API.delete(`/api/properties/delete/${propertyId}`, {
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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (formData) => {
    const requiredFields = [
      'title', 'description', 
      'city', 'locality', 'address', 'pincode',
      'propertyType', 'furnishing', 'possessionStatus', 'price', 'unitsAvailable'
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
    setEditingId(property._id);
    setFormData({
      firstName: property.firstName || '',
      title: property.title || '',
      description: property.description || '',
      long_description: property.long_description || '',
      state: property.state || '',
      city: property.city || '',
      locality: property.locality || '',
      address: property.address || '',
      pincode: property.pincode || '',
      propertyType: property.propertyType || '',
      furnishing: property.furnishing || '',
      possessionStatus: property.possessionStatus || '',
      bhk: property.bhk || '',
      bathrooms: property.bathrooms || '',
      balconies: property.balconies || '',
      facing: property.facing || '',
      parkings: Array.isArray(property.parkings) ? property.parkings : (property.parkings ? [property.parkings] : []),
      landmarks: Array.isArray(property.landmarks) ? property.landmarks : [],
      price: property.price || '',
      ageOfProperty: property.ageOfProperty || "New",
      totalFloors: property.totalFloors || '',
      floor: property.floor || '',
      coverImage: property.coverImage || '',
      galleryImages: property.galleryImages || [],
      floorplanImages: property.floorplanImages || [],
      mediaFiles: property.mediaFiles || [],
      amenities: property.amenities || [],
      facilities: property.facilities || [],
      security: property.security || [],
      area: property.area || { value: 0, unit: 'sqft' },
      unitsAvailable: property.unitsAvailable || 1,
      availableFrom: property.availableFrom || null,
      mapLink: property.mapLink || '',
      reraApproved: property.reraApproved || false,
      reraNumber: property.reraNumber || '',
      priceNegotiable: property.priceNegotiable || false,
    });
    setActiveTab('sell'); // Switch to sell tab when editing
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
      ageOfProperty: '',
      totalFloors: '',
      floor: '',
      coverImage: '',
      galleryImages: [],
      floorplanImages: [],
      mediaFiles: [],
      amenities: [],
      facilities: [],
      security: [],
      area: { value: 0, unit: 'sqft' },
      unitsAvailable: '',
      availableFrom: '',
      mapLink: '',
      reraApproved: false,
      reraNumber: '',
      priceNegotiable: false,
    });
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-layout">
        <DashboardNav 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          user={user}
          handleLogout={handleLogout}
        />

        <div className="dashboard-content">
          {activeTab === 'sell' && (
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
          )}

          {activeTab === 'properties' && (
            <>
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

                      {/* Cover Image */}
                      {p.coverImage && (
  <div className="property-cover">
    <img
      src={
        p.coverImage.startsWith('http')
          ? p.coverImage
          : `${API_BASE_URL}${p.coverImage}`
      }
      alt={p.title}
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = '/placeholder-property.jpg';
      }}
    />
  </div>
)}


                      {/* Gallery Images Carousel */}
                      {p.galleryImages?.length > 0 && (
  <div className="property-galleryy">
    <div className="gallery-scroll">
      {p.galleryImages.map((img, index) => (
        <img
          key={index}
          src={
            img.startsWith('http')
              ? img
              : `${API_BASE_URL}${img}`
          }
          alt={`Gallery ${index}`}
        />
      ))}
    </div>
  </div>
)}


                      <div className="property-details">
        <div className="detail-row">
          <span className="detail-label">Location:</span>
          <span>{p.state},{p.locality}, {p.city}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Address:</span>
          <span>{p.address},{p.pincode}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Map Link:</span>
          <span>{p.mapLink}</span>
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
          <span className="detail-label">BHK:</span>
          <span>{p.bhk}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Bathrooms:</span>
          <span>{p.bathrooms}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Balconies:</span>
          <span>{p.balconies}</span>
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
          <span className="detail-label">Developer Name:</span>
          <span>{p.firstName}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Price:</span>
          <span>{formatIndianPrice(p.price)}(₹{(p.price)})</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Area:</span>
          <span>
            {p.area?.value} {p.area?.unit}
          </span>
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

        <div className="detail-row">
          <span className="detail-label">Units Availability:</span>
          <span>{p.unitsAvailable}</span>
        </div>

        <div className="detail-row">
  <span className="detail-label">Availability Date:</span>
  
  {/* ✅ Recommended: properly formatted date-time in IST */}
  <span>
    {p.availableFrom 
      ? new Date(p.availableFrom).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          // hour: '2-digit',
          // minute: '2-digit'
        })
      : 'Not set'}
  </span>
</div>


        <div className="detail-row">
          <span className="detail-label"> RERA Approved:</span>
          <span>{p.reraApproved ? '✅' : '❌'}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label"> RERA No:</span>
          <span>{p.reraNumber}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Price is negotiable:</span>
          <span>{p.priceNegotiable ? '✅' : '❌'}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Amenities:</span>
          <span>{p.amenities}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Facilities:</span>
          <span>{p.facilities}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Security:</span>
          <span>{p.security}</span>
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

                      {/* Floor Plans */}
                      {p.floorplanImages && p.floorplanImages.length > 0 && (
                        <div className="property-floorplans">
                          <h5>Floor Plans ({p.floorplanImages.length})</h5>
                          <div className="floorplan-grid">
                            {p.floorplanImages.map((img, index) => (
                              <div key={index} className="floorplan-item">
                                <img 
                                  src={`${API_BASE_URL}${img}`} 
                                  alt={`Floorplan ${index}`}
                                  onError={(e) => {
                                    e.target.onerror = null; 
                                    e.target.src = '/placeholder-floorplan.jpg';
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Media Files */}
                      {p.mediaFiles && p.mediaFiles.length > 0 && (
                        <div className="property-media">
                          <h5>Media Files ({p.mediaFiles.length})</h5>
                          <div className="media-grid">
                            {p.mediaFiles.map((file, index) => (
                              <div key={index} className="media-item">
                                {file.type === 'image' ? (
                                  <img 
                                    src={`${API_BASE_URL}${file.src}`} 
                                    alt={`Media ${index}`}
                                    onError={(e) => {
                                      e.target.onerror = null; 
                                      e.target.src = '/placeholder-image.jpg';
                                    }}
                                  />
                                ) : (
                                  <div className="video-container">
                                    <video controls>
                                      <source 
                                        src={`${API_BASE_URL}${file.src}`} 
                                        type={`video/${file.src.split('.').pop()}`} 
                                      />
                                    </video>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;