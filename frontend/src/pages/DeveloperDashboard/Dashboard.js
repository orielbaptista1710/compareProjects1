// Developer Dashboard
// ==============================
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './Dashboard.css';
import SellPropertyForm from '../../components/DevDashboardPageComponents/SellPropertyFormComponents/SellPropertyForm';
import DeveloperSupport from "./DeveloperDashboardComponents/DeveloperSupport";
import DashboardNav from './DeveloperDashboardComponents/DashboardNav';
// import SkeletonPropertyCard from '../components/SkeletonComponents/SkeletonPropertyCard';
import API from '../../api'; // Axios instance
import DevPropertyList from './DeveloperDashboardComponents/DevPropertyList';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const REQUIRED_FIELDS = [
  "title", "description", "city", "locality", "address", "pincode",
  "propertyType", "furnishing", "possessionStatus", "price", "unitsAvailable"
];

const initialFormData = {
  developerName: "",
  // email: "",
  // phone: "",
  title: "",
  description: "",
  long_description: "",
  state: "",
  city: "",
  locality: "",
  address: "",
  pincode: "",
  mapLink: "",
  area: { value: 0, unit: "sqft" },
  reraApproved: false,
  reraNumber: "",
  priceNegotiable: false,
  price: "",
  emiStarts: "",
  propertyType: "",
  furnishing: "",
  possessionStatus: "",
  bhk: "",
  bathrooms: "",
  balconies: "",
  facing: "",
  parkings: [],
  ageOfProperty: "",
  totalFloors: "",
  floor: "",
  wing: "",
  unitsAvailable: "",
  availableFrom: null,
  amenities: [],
  facilities: [],
  security: [],
  coverImage: "",
  galleryImages: [],
  floorplanImages: [],
  mediaFiles: [],
};

const normalizePropertyData = (property = {}) => ({
  ...initialFormData,
  ...property,
  area: property.area || { value: 0, unit: "sqft" },
  parkings: Array.isArray(property.parkings) ? property.parkings : [],
  galleryImages: property.galleryImages || [],
  floorplanImages: property.floorplanImages || [],
  mediaFiles: property.mediaFiles || [],
  amenities: property.amenities || [],
  facilities: property.facilities || [],
  security: property.security || [],
  reraApproved: !!property.reraApproved,
  priceNegotiable: !!property.priceNegotiable,
  availableFrom: property.availableFrom || null,
});


const Dashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('sell');
  const [formData, setFormData] = useState(initialFormData);
  const [editingId, setEditingId] = useState(null);

  // -------------------------
  // Helper: Format Price
  // -------------------------
  const formatIndianPrice = (price) => {
    if (!price) return 'Price on Request';
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)} Lakh`;
    return `₹${price.toLocaleString('en-IN')}`;
  };

  // -------------------------
  // Logout
  // -------------------------
  const handleLogout = useCallback(async () => {
    try {
      await API.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      localStorage.removeItem('user');
      queryClient.clear();
      navigate('/login');
    }
  }, [navigate, queryClient]);

  // -------------------------
  // Fetch Current User
  // -------------------------
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const res = await API.get('/api/auth/me');
      return res.data.user;
    },
    onError: (error) => {
      if (error.response?.status === 401) handleLogout();
    },
  });

  useEffect(() => {
    if (!userLoading && !user) navigate('/login');
  }, [user, userLoading, navigate]);

  // -------------------------
  // Fetch Developer Properties
  // -------------------------
  const { data: properties = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['my-properties'],
    queryFn: async () => {
      const res = await API.get('/api/properties/my-properties');
      return res.data;
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to fetch properties");
    },
  });

  // -------------------------
  // Add Property
  // -------------------------
  const { mutate: addProperty, isPending: isAdding } = useMutation({
    mutationFn: (newProperty) => API.post('/api/properties/add', newProperty),
    onSuccess: () => {
      toast.success("Property added successfully");
      queryClient.invalidateQueries(['my-properties']);
      setFormData(initialFormData);
      setActiveTab('properties');
      setEditingId(null);
    },
  });

  // -------------------------
  // Update Property
  // -------------------------
  const { mutate: updateProperty, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, data }) => API.put(`/api/properties/update/${id}`, data),
    onSuccess: () => {
      toast.success('Property updated successfully');
      refetch();
      setActiveTab('properties');
      setEditingId(null);
      setFormData(initialFormData);
    },
  });

  // -------------------------
  // Delete Property
  // -------------------------
  const { mutate: deleteProperty } = useMutation({
    mutationFn: (id) => API.delete(`/api/properties/delete/${id}`),
    onSuccess: () => {
      toast.success('Property deleted successfully');
      refetch();
    },
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this property?'))
      deleteProperty(id);
  };

  // -------------------------
  // Form Submit
  // -------------------------
  const handleSubmit = (data) => {
    const missing = REQUIRED_FIELDS.filter((f) => !data[f]);
    if (missing.length) {
      toast.error(`Please fill in: ${missing.join(', ')}`);
      return;
    }
    editingId ? updateProperty({ id: editingId, data }) : addProperty(data);
  };


  // const toggleExpand = (id) => {
  //   setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  // };


 const handleEdit = (property) => {
    setEditingId(property._id);
    setFormData(normalizePropertyData(property));
    setActiveTab('sell');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(initialFormData);
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
              editingId={editingId}
              isAdding={isAdding}
              isUpdating={isUpdating}
              onSubmit={handleSubmit}
              handleCancelEdit={handleCancelEdit}
            />
          )}

   {/* My Properties Section */}
         {activeTab === 'properties' && (
  <>
    <h2 className="properties-title">My Properties</h2>

    <DevPropertyList
      properties={properties}
      isLoading={isLoading}
      isError={isError}
      onEdit={handleEdit}
      onDelete={handleDelete}
      formatIndianPrice={formatIndianPrice}
    />
  </>
)}




          {activeTab === "support" && <DeveloperSupport />}

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
