// src/pages/<CustomerFolder>/CustomerProfilePage
import { useState, useContext, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Home, User, Heart, Scale, Gift, Settings } from "lucide-react";
import { AuthContext } from "../../contexts/AuthContext";
import { useCompare } from "../../contexts/CompareContext";
import toast from "react-hot-toast";
import ProfileSidebar from "../CustomerProfileDashboard/CustomerProfileDashComponents/ProfileSidebar";
import TabErrorBoundary from "../CustomerProfileDashboard/CustomerProfileDashComponents/TabErrorBoundary";
import TabLoader from "../CustomerProfileDashboard/CustomerProfileDashComponents/TabLoader";
import "./CustomerProfilePage.css";

// Each tab is its own chunk — only the active one is fetched.
const ProfileTab = lazy(() => import("./CustomerProfileDashComponents/tabs/ProfileTab"));
const ShortlistTab = lazy(() => import("./CustomerProfileDashComponents/tabs/ShortlistTab"));
const CompareTab = lazy(() => import("./CustomerProfileDashComponents/tabs/CompareTab"));
const OffersTab = lazy(() => import("./CustomerProfileDashComponents/tabs/OffersTab"));
const SettingsTab = lazy(() => import("./CustomerProfileDashComponents/tabs/SettingsTab"));

const TAB_COMPONENTS = {
  profile: ProfileTab,
  shortlist: ShortlistTab,
  compare: CompareTab,
  offers: OffersTab,
  settings: SettingsTab,
};

const CustomerProfilePage = () => {
  const { currentUser, loading, logout } = useContext(AuthContext);
  const { compareList } = useCompare();
  const [activeTab, setActiveTab] = useState("profile");
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

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
    { key: "settings", label: "Settings", icon: Settings, action: () => setActiveTab("settings") },
  ];

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
        onLogout={handleLogout}
      />

      <main className="profile-main">
        {/* key={activeTab} forces a clean remount on tab switch, which also
            resets the error boundary — a tab that failed once won't stay
            stuck broken after the user navigates away and back. */}
        <TabErrorBoundary key={activeTab}>
          <Suspense fallback={<TabLoader />}>
            <ActiveTab />
          </Suspense>
        </TabErrorBoundary>
      </main>
    </div>
  );
};

export default CustomerProfilePage;