// src/pages/<CustomerFolder>/CustomerProfilePage
import { useState, useContext, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Home, User, Heart, Scale, Gift, Settings, Building2, Plus } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import { useCompare } from "../../contexts/CompareContext";
import { CUSTOMER_LISTINGS_ENABLED } from "../../config/features";
import { CUSTOMER_LISTING_ENDPOINTS } from "../../features/listings/hooks/useMyListings";
import useListingsWorkspace from "../../features/listings/hooks/useListingsWorkspace";
import { posterRoleOf, getPostingGate } from "../../features/listings/postingGate";
import { LISTING_STATUS } from "../../features/admin/listingStatus";
import toast from "react-hot-toast";
import ProfileSidebar from "../../features/customer-dashboard/CustomerProfileDashComponents/ProfileSidebar";
import TabErrorBoundary from "../../features/customer-dashboard/CustomerProfileDashComponents/TabErrorBoundary";
import TabLoader from "../../features/customer-dashboard/CustomerProfileDashComponents/TabLoader";
import "./CustomerProfilePage.css";

// Each tab is its own chunk — only the active one is fetched.
const ProfileTab = lazy(() => import("../../features/customer-dashboard/CustomerProfileDashComponents/tabs/ProfileTab"));
const ShortlistTab = lazy(() => import("../../features/customer-dashboard/CustomerProfileDashComponents/tabs/ShortlistTab"));
const CompareTab = lazy(() => import("../../features/customer-dashboard/CustomerProfileDashComponents/tabs/CompareTab"));
const OffersTab = lazy(() => import("../../features/customer-dashboard/CustomerProfileDashComponents/tabs/OffersTab"));
const SettingsTab = lazy(() => import("../../features/customer-dashboard/CustomerProfileDashComponents/tabs/SettingsTab"));

// Posting tabs. Only reachable (menu, ?tab=) when CUSTOMER_LISTINGS_ENABLED.
const PostPropertyTab = lazy(() => import("../../features/customer-dashboard/CustomerProfileDashComponents/tabs/PostPropertyTab"));
const MyListingsTab = lazy(() => import("../../features/customer-dashboard/CustomerProfileDashComponents/tabs/MyListingsTab"));

const TAB_COMPONENTS = {
  profile: ProfileTab,
  shortlist: ShortlistTab,
  compare: CompareTab,
  offers: OffersTab,
  settings: SettingsTab,
  post: PostPropertyTab,
  listings: MyListingsTab,
};

const LISTING_TABS = ["post", "listings"];

// Only a tab we render, and the posting tabs only when the feature is on. Looks
// the key up as an own property so "constructor" and the like can't match.
const isKnownTab = (tab) =>
  Object.prototype.hasOwnProperty.call(TAB_COMPONENTS, tab) &&
  (CUSTOMER_LISTINGS_ENABLED || !LISTING_TABS.includes(tab));

const CustomerProfilePage = () => {
  const { currentUser, loading, logout } = useContext(AuthContext);
  const { compareList } = useCompare();
  // ?tab=post|listings|… opens a tab directly (e.g. from the Post property page)
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const requested = searchParams.get("tab");
    return isKnownTab(requested) ? requested : "profile";
  });
  const [settingsSection, setSettingsSection] = useState("account");
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  // Lets a tab (e.g. Offers) jump to another tab, optionally to a Settings section.
  const goToTab = (tab, section = "account") => {
    setSettingsSection(section);
    setActiveTab(tab);
  };

  // Listings, form values and save/delete live here (not in a tab) because a
  // tab is remounted on every switch: Edit in My listings must still have the
  // listing loaded when the Post tab opens. Nothing is fetched while the
  // feature is off.
  const posterRole = posterRoleOf(currentUser);
  const postingGate = getPostingGate(currentUser);
  const workspace = useListingsWorkspace({
    endpoints: CUSTOMER_LISTING_ENDPOINTS,
    role: posterRole,
    enabled: CUSTOMER_LISTINGS_ENABLED && Boolean(currentUser),
    onSaved: () => goToTab("listings"),
    onEdit: () => goToTab("post"),
  });
  const pendingCount = workspace.properties.filter((p) => p.status === LISTING_STATUS.PENDING).length;

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully!");
    navigate("/");
  };

  const menuItems = [
    { key: "home", label: "Home", icon: Home, action: () => navigate("/") },
    { key: "profile", label: "Profile", icon: User, action: () => setActiveTab("profile") },
    { key: "shortlist", label: "Shortlist", icon: Heart, action: () => setActiveTab("shortlist") },
    {
      key: "compare",
      label: "Compare",
      badge: compareList.length > 0 ? compareList.length : null,
      icon: Scale,
      action: () => setActiveTab("compare"),
    },
    { key: "offers", label: "Offers", icon: Gift, action: () => setActiveTab("offers") },
    ...(CUSTOMER_LISTINGS_ENABLED
      ? [{
          key: "listings",
          label: "My listings",
          // listings waiting for admin review
          badge: pendingCount > 0 ? pendingCount : null,
          icon: Building2,
          action: () => setActiveTab("listings"),
        }]
      : []),
    { key: "settings", label: "Settings", icon: Settings, action: () => setActiveTab("settings") },
  ];

  const cta = CUSTOMER_LISTINGS_ENABLED
    ? {
        key: "post",
        label: "Post a property",
        icon: Plus,
        // A fresh listing, not the one that was being edited
        action: () => {
          workspace.handleStartNew();
          setActiveTab("post");
        },
      }
    : undefined;

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading your profile…</p>
      </div>
    );
  }

  if (!currentUser) return null;

  const ActiveTab = TAB_COMPONENTS[activeTab];

  return (
    <div className="customer-profile-page">
      <ProfileSidebar
        currentUser={currentUser}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        activeTab={activeTab}
        menuItems={menuItems}
        cta={cta}
        onLogout={handleLogout}
      />

      <main className="profile-main">
        {/* key={activeTab} forces a clean remount on tab switch, which also
            resets the error boundary — a tab that failed once won't stay
            stuck broken after the user navigates away and back. */}
        <TabErrorBoundary key={activeTab}>
          <Suspense fallback={<TabLoader />}>
            {/* The posting tabs read workspace/posterRole/gate/currentUser; the
                other tabs ignore them. */}
            <ActiveTab
              onNavigateTab={goToTab}
              initialSection={settingsSection}
              workspace={workspace}
              posterRole={posterRole}
              gate={postingGate}
              currentUser={currentUser}
            />
          </Suspense>
        </TabErrorBoundary>
      </main>
    </div>
  );
};

export default CustomerProfilePage;