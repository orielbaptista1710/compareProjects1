// tabs/PostPropertyTab.jsx
// The listing form for an owner or an agent. If the account can't post yet
// (email not verified, agent pending/rejected/suspended) it says why instead of
// showing a form that would fail on save. The workspace (form values, edit
// state, save) lives in CustomerProfilePage so it survives tab switches.
import SellPropertyForm from "../../../developer-dashboard/property-form/SellPropertyForm";
import "./ListingTabs.css";

const PostPropertyTab = ({ workspace, posterRole, gate, currentUser, onNavigateTab }) => {
  if (gate) {
    return (
      <div className="tab-panel">
        <div className="lt-gate" role="status">
          <h2 className="lt-gate__title">{gate.title}</h2>
          <p className="lt-gate__text">{gate.text}</p>
          <div className="lt-gate__actions">
            {gate.toProfile && (
              <button type="button" className="btn-primary" onClick={() => onNavigateTab("profile")}>
                Go to my profile
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={() => onNavigateTab("listings")}>
              View my listings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SellPropertyForm
      role={posterRole}
      formData={workspace.formData}
      editingId={workspace.editingId}
      editingStatus={workspace.editingStatus}
      isAdding={workspace.isAdding}
      isUpdating={workspace.isUpdating}
      draftOwner={currentUser._id}
      onSubmit={workspace.handleSubmit}
      handleCancelEdit={workspace.handleCancelEdit}
      onShowListings={() => onNavigateTab("listings")}
    />
  );
};

export default PostPropertyTab;
