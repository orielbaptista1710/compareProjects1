// Developer Dashboard
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import './Dashboard.css';
import SellPropertyForm from '../../components/DevDashboardPageComponents/SellPropertyFormComponents/SellPropertyForm';
import DeveloperSupport from "./DeveloperDashboardComponents/DeveloperSupport";
import DashboardNav from './DeveloperDashboardComponents/DashboardNav';
import API from '../../api';
import DevPropertyList from './DeveloperDashboardComponents/DevPropertyList/DevPropertyList';
import './DeveloperDashboardComponents/DevPropertyList/DevPropertyList.css';

import toast from 'react-hot-toast';
import toastError from '../../utils/toastError';

import {
  initialFormData,
  normalizePropertyData,
  REQUIRED_FIELDS,
} from "./utils/developerDashPropertyHelpers";
import { formatCurrency } from "../../utils/formatters";

const Dashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('sell');
  const [formData, setFormData] = useState(initialFormData);
  const [editingId, setEditingId] = useState(null);

  const formatIndianPrice = formatCurrency;

  // Logout
  const handleLogout = useCallback(async () => {
    try {
      await API.post('/api/auth/logout');
      toast.success('Logged out successfully');
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      localStorage.removeItem('user');
      queryClient.clear();
      navigate('/login');
    }
  }, [navigate, queryClient]);

  // Fetch Current User
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

  // Fetch Developer Properties
  const { data: properties = [], isLoading, isError } = useQuery({
    queryKey: ['my-properties'],
    queryFn: async () => {
      const res = await API.get('/api/properties/my-properties');
      return res.data;
    },
  });

  // Add Property
  const { mutate: addProperty, isPending: isAdding } = useMutation({
    mutationFn: (newProperty) => API.post('/api/properties/add', newProperty),
    onSuccess: () => {
      toast.success('Property submitted successfully!');
      queryClient.invalidateQueries(['my-properties']);
      setFormData(initialFormData);
      setActiveTab('properties');
      setEditingId(null);
    },
    onError: (err) => toastError(err, 'Failed to add property'),
  });

  // Update Property
  const { mutate: updateProperty, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, data }) => API.put(`/api/properties/update/${id}`, data),
    onSuccess: () => {
      toast.success('Property updated successfully');
      queryClient.invalidateQueries({ queryKey: ['my-properties'] });
      setActiveTab('properties');
      setEditingId(null);
      setFormData(initialFormData);
    },
    onError: (err) => toastError(err, 'Failed to update property'),
  });

  // Delete Property
  const { mutate: deleteProperty } = useMutation({
    mutationFn: (id) => API.delete(`/api/properties/delete/${id}`),
    onSuccess: () => toast.success('Property deleted'),
    onError: (err) => toastError(err, 'Failed to delete property'),
  });

  const handleDelete = (id) => {
      deleteProperty(id);
  };

  // Form Submit
  const handleSubmit = (data) => {
    const missing = REQUIRED_FIELDS.filter((f) => !data[f]);
    if (missing.length) {
      toast.error(`Please fill in: ${missing.join(', ')}`);
      return;
    }
    editingId ? updateProperty({ id: editingId, data }) : addProperty(data);
  };

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

        <div className="dashboard-panel">

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

          {activeTab === 'properties' && (
            <div className="dashboard-tab-content">
              <h2 className="dashboard-tab-title">My Properties</h2>
              <DevPropertyList
                properties={properties}
                isLoading={isLoading}
                isError={isError}
                onEdit={handleEdit}
                onDelete={handleDelete}
                formatIndianPrice={formatIndianPrice}
              />
            </div>
          )}

          {activeTab === 'support' && <DeveloperSupport />}

        </div>
      </div>
    </div>
  );
};

export default Dashboard;