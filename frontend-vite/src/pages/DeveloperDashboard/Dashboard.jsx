// Developer Dashboard
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import './Dashboard.css';
import SellPropertyForm from '../../features/developer-dashboard/property-form/SellPropertyForm';
import DeveloperSupport from "../../features/developer-dashboard/components/DeveloperSupport/DeveloperSupport";
import DashboardNav from '../../features/developer-dashboard/components/DashboardNav/DashboardNav';
import API from '../../api/api';
import DevPropertyList from '../../features/developer-dashboard/components/DevPropertyList/DevPropertyList';
import '../../features/developer-dashboard/components/DevPropertyList/DevPropertyList.css';

import toast from 'react-hot-toast';
import useMyListings, { DEVELOPER_LISTING_ENDPOINTS } from '../../features/listings/hooks/useMyListings';

import {
  initialFormData,
  normalizePropertyData,
  REQUIRED_FIELDS,
} from "../../features/developer-dashboard/utils/developerDashPropertyHelpers";
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
      queryClient.clear();
      navigate('/login');
    }
  }, [navigate, queryClient]);

  // Fetch Current User (a 401 is handled by api.js's interceptor + the redirect below)
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const res = await API.get('/api/auth/me');
      return res.data.user;
    },
  });

  useEffect(() => {
    if (!userLoading && !user) navigate('/login');
  }, [user, userLoading, navigate]);

  // Listings + add/update/delete, shared with the customer "My listings" tab
  const {
    properties, isLoading, isError,
    addProperty, isAdding, updateProperty, isUpdating, deleteProperty,
  } = useMyListings(DEVELOPER_LISTING_ENDPOINTS, {
    onSaved: () => {
      setFormData(initialFormData);
      setActiveTab('properties');
      setEditingId(null);
    },
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
    <div className="dashboard-shell">
      <DashboardNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        handleLogout={handleLogout}
      />

      {/* The one scroll container for all tab content on desktop */}
      <main className="dashboard-main">

        {activeTab === 'sell' && (
          <SellPropertyForm
            formData={formData}
            editingId={editingId}
            isAdding={isAdding}
            isUpdating={isUpdating}
            onSubmit={handleSubmit}
            handleCancelEdit={handleCancelEdit}
            onShowListings={() => setActiveTab('properties')}
          />
        )}

        {activeTab === 'properties' && (
          <div className="dashboard-tab-content">
            <h1 className="dashboard-tab-title">Listings</h1>
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

      </main>
    </div>
  );
};

export default Dashboard;