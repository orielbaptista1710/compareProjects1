// frontend/src/contexts/AuthContext.jsx

/* eslint-disable react-refresh/only-export-components */

import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { CustomerAuth } from "../config/firebase";

// import {AuthContext} from "./contextInstances/AuthContextInstance"; 


import { createContext } from "react";
import API from "../api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  // loading = true means we haven't heard from Firebase yet at all.
  // We block rendering until this is false so ProtectedCustomerRoute
  // never checks currentUser before Firebase has had a chance to restore
  // the session from its local cache (this happens in <200ms, no network needed).

  const [loading, setLoading] = useState(true);

  // syncingProfile = true means Firebase says there IS a user, but we're
  // still fetching their MongoDB profile from /api/customers/me.
  // We track this separately so we don't flash a redirect to /customer-login
  // while the profile is loading.
  const [syncingProfile, setSyncingProfile] = useState(false);

  useEffect(() => {
    // onAuthStateChanged fires once immediately on mount with the cached
    // Firebase session (no network), then again whenever auth state changes.
    const unsubscribe = CustomerAuth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Firebase says we have a logged-in user.
        // Set syncingProfile so ProtectedCustomerRoute shows a spinner
        // instead of redirecting while we fetch the MongoDB profile.
        setSyncingProfile(true);

        try {
          // Force-refresh the token once to make sure it's not expired.
          // The interceptor in api.js handles token attachment on every request.
          await firebaseUser.getIdToken(true);

          const { data } = await API.get("/api/customers/me");
          setCurrentUser(data.customer);
        } catch (err) {
          console.error("AuthContext /me error:", err);
          // /me failed — treat as logged out.
          // This handles cases like account deleted from backend but
          // Firebase session still active.
          setCurrentUser(null);
        } finally {
          setSyncingProfile(false);
        }
      } else {
        // Firebase says no user — clear everything immediately.
        setCurrentUser(null);
        setSyncingProfile(false);
      }
      // First Firebase response received — safe to render the app now.
      setLoading(false);
    });
    // Cleanup: unsubscribe the listener when AuthProvider unmounts.
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(CustomerAuth);
    setCurrentUser(null);
  };

  const refreshUser = async () => {
    try {
      const user = CustomerAuth.currentUser;

      if (!user) return;

      await user.getIdToken(true);

      const { data } = await API.get("/api/customers/me");
      setCurrentUser(data.customer);
    } catch (err) {
      console.error("refreshUser error:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        syncingProfile,
        logout,
        refreshUser,
      }}
    >
      {/* Block the entire app until Firebase restores its cached session.
          This is fast (<200ms) and prevents a flash of the login page on refresh. */}
      {!loading && children}
    </AuthContext.Provider>
  );
}