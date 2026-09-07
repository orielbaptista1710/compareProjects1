/* eslint-disable react-refresh/only-export-components */

import { useEffect, useRef, useState } from "react";
import { createContext } from "react";
import { signOut } from "firebase/auth";

import { CustomerAuth } from "../config/firebase";
import API from "../api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncingProfile, setSyncingProfile] = useState(false);

  // Used to invalidate older async auth/profile requests.
  const authRequestIdRef = useRef(0);

  // Prevent state updates after the provider unmounts.
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const unsubscribe = CustomerAuth.onAuthStateChanged(
      async (firebaseUser) => {
        // Every auth event gets a unique request ID.
        // Any older async operation becomes stale.
        const requestId = ++authRequestIdRef.current;

        if (!firebaseUser) {
          if (!mountedRef.current) return;

          setCurrentUser(null);
          setSyncingProfile(false);
          setLoading(false);

          return;
        }

        if (!mountedRef.current) return;

        setSyncingProfile(true);

        try {
          // Refresh/validate the Firebase token.
          await firebaseUser.getIdToken(true);

          // Check whether this auth request is still current.
          if (
            !mountedRef.current ||
            requestId !== authRequestIdRef.current
          ) {
            return;
          }

          const { data } = await API.get("/api/customers/me");

          // Ignore stale responses.
          if (
            !mountedRef.current ||
            requestId !== authRequestIdRef.current
          ) {
            return;
          }

          setCurrentUser(data?.customer ?? null);
        } catch (error) {
          // Ignore errors from stale requests.
          if (
            !mountedRef.current ||
            requestId !== authRequestIdRef.current
          ) {
            return;
          }

          console.error("AuthContext /me error:", error);

          setCurrentUser(null);
        } finally {
          // Only the latest request may update loading state.
          if (
            mountedRef.current &&
            requestId === authRequestIdRef.current
          ) {
            setSyncingProfile(false);
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mountedRef.current = false;

      // Invalidate any in-flight async auth request.
      authRequestIdRef.current += 1;

      unsubscribe();
    };
  }, []);

  const logout = async () => {
    // Invalidate any in-flight profile request before logout.
    authRequestIdRef.current += 1;

    setSyncingProfile(false);
    setCurrentUser(null);

    try {
      await signOut(CustomerAuth);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const refreshUser = async () => {
    const user = CustomerAuth.currentUser;

    if (!user) {
      setCurrentUser(null);
      return;
    }

    const requestId = ++authRequestIdRef.current;

    try {
      setSyncingProfile(true);

      await user.getIdToken(true);

      if (
        !mountedRef.current ||
        requestId !== authRequestIdRef.current
      ) {
        return;
      }

      const { data } = await API.get("/api/customers/me");

      if (
        !mountedRef.current ||
        requestId !== authRequestIdRef.current
      ) {
        return;
      }

      setCurrentUser(data?.customer ?? null);
    } catch (error) {
      if (
        !mountedRef.current ||
        requestId !== authRequestIdRef.current
      ) {
        return;
      }

      console.error("refreshUser error:", error);
    } finally {
      if (
        mountedRef.current &&
        requestId === authRequestIdRef.current
      ) {
        setSyncingProfile(false);
      }
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
      {!loading && children}
    </AuthContext.Provider>
  );
}