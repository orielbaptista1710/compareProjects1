// tabs/MyListingsTab.jsx
// The owner's or agent's own listings with their review status. Viewing and
// deleting are allowed in every account state; Edit opens the Post tab, which
// explains anything blocking an edit.
import ListingsGrid from "../../../listings/components/ListingsGrid";
import EmptyListings from "../../../listings/components/EmptyListings";
import "./ListingTabs.css";

const MyListingsTab = ({ workspace, onNavigateTab }) => {
  const { properties, isLoading, isError, handleEdit, handleDelete, handleStartNew } = workspace;

  // A fresh listing, not the one that was being edited
  const startNew = () => {
    handleStartNew();
    onNavigateTab("post");
  };

  return (
    <div className="tab-panel">
      <div className="panel-header lt-header">
        <div>
          <h2>My listings</h2>
          <p className="panel-subtitle">
            Every listing is checked by our team before it goes live.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={startNew}>
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
            text="Post your first property and we'll review it."
            actionLabel="Post a property"
            onAction={startNew}
          />
        }
      />
    </div>
  );
};

export default MyListingsTab;
