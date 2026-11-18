// Developer Dashboard
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import './Dashboard.css';
import SellPropertyForm from '../../features/developer-dashboard/property-form/SellPropertyForm';
import DeveloperSupport from "../../features/developer-dashboard/components/DeveloperSupport/DeveloperSupport";
import DashboardNav from '../../features/developer-dashboard/components/DashboardNav/DashboardNav';
import API from '../../api/api';
import ListingsGrid from '../../features/listings/components/ListingsGrid';
import EmptyListings from '../../features/listings/components/EmptyListings';

import toast from 'react-hot-toast';
import { DEVELOPER_LISTING_ENDPOINTS } from '../../features/listings/hooks/useMyListings';
import useListingsWorkspace from '../../features/listings/hooks/useListingsWorkspace';
import { LISTED_BY } from '../../constants/roles';
import { clearListingDrafts } from '../../features/listings/draftStorage';

const Dashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('sell');

  // Stable, so the form isn't handed a new function on every dashboard render
  const showForm = useCallback(() => setActiveTab('sell'), []);
  const showListings = useCallback(() => setActiveTab('properties'), []);

  // Logout
  const handleLogout = useCallback(async () => {
    try {
      await API.post('/api/auth/logout');
      toast.success('Logged out successfully');
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      // Unfinished listings stay on this browser until now; don't leave them for
      // the next person on a shared computer
      clearListingDrafts();
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

  // Listings, the form's values and add/update/delete are shared with the
  // customer dashboards (useListingsWorkspace); this page only owns its tabs.
  const {
    properties, isLoading, isError,
    formData, editingId, editingStatus, isAdding, isUpdating,
    handleSubmit, handleEdit, handleStartNew, handleCancelEdit, handleDelete,
  } = useListingsWorkspace({
    endpoints: DEVELOPER_LISTING_ENDPOINTS,
    role: LISTED_BY.DEVELOPER,
    onSaved: showListings,
    onEdit: showForm,
  });

  // "New listing": a fresh form, not the listing that was being edited
  const startNew = useCallback(() => {
    handleStartNew();
    showForm();
  }, [handleStartNew, showForm]);

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
            editingStatus={editingStatus}
            isAdding={isAdding}
            isUpdating={isUpdating}
            draftOwner={user?.username}
            onSubmit={handleSubmit}
            handleCancelEdit={handleCancelEdit}
            onShowListings={showListings}
          />
        )}

        {activeTab === 'properties' && (
          <div className="dashboard-tab-content">
            <div className="dashboard-tab-head">
              <h1 className="dashboard-tab-title">Listings</h1>
              <button type="button" className="dashboard-new-btn" onClick={startNew}>
                New listing
              </button>
            </div>
            <ListingsGrid
              listings={properties}
              isLoading={isLoading}
              isError={isError}
              onEdit={handleEdit}
              onDelete={handleDelete}
              empty={
                <EmptyListings
                  title="No listings yet"
                  text="Add your first property and we'll review it."
                  actionLabel="New listing"
                  onAction={startNew}
                />
              }
            />
          </div>
        )}

        {activeTab === 'support' && <DeveloperSupport />}

      </main>
    </div>
  );
};

export default Dashboard;