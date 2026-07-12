// components/ProtectedCustomerRoute.jsx

import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import LoadingSpinner from "../shared/LoadingSpinners/LoadingSpinner";

const ProtectedCustomerRoute = ({ children }) => {
  const { currentUser, loading, syncingProfile } = useContext(AuthContext);

  // loading = Firebase hasn't responded yet (blocked by AuthProvider anyway,
  // so this should never be true here — but kept as a safety net).
  if (loading) return <LoadingSpinner />;

  // syncingProfile = Firebase confirmed a user exists, but we're still
  // fetching their MongoDB profile. Show a spinner instead of redirecting.
  // WITHOUT this check, navigate("/customer-profile") after login would hit
  // this route while currentUser is still null → redirect back to login.
  if (syncingProfile) return <LoadingSpinner />;

  // Profile fetch done. If we have a user, show the page. If not, redirect.
  return currentUser ? children : <Navigate to="/customer-login" replace />;
};

export default ProtectedCustomerRoute;