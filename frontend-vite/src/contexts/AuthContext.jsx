import { createContext, useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { CustomerAuth } from "../config/firebase";
import API from "../api";
 
export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const unsubscribe = CustomerAuth.onAuthStateChanged(async (firebaseUser) => {
    if (firebaseUser) {
      try {
        // ✅ Force token refresh to ensure it's valid before calling /me
        await firebaseUser.getIdToken(true); // true = force refresh
        const { data } = await API.get("/api/customers/me");
        setCurrentUser(data.customer);
      } catch (err) {
        console.error("AuthContext /me error:", err);
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }
    setLoading(false);
  });

  return () => unsubscribe();
}, []);

  const logout = async () => {
    await signOut(CustomerAuth);
    setCurrentUser(null);
  };

  //  refresh function (instead of exposing setCurrentUser)
  const refreshUser = async () => {
    try {
      const user = CustomerAuth.currentUser;
      if (!user) return;

      const token = await user.getIdToken(true);

      const { data } = await API.get("/api/customers/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCurrentUser(data.customer);
    } catch (err) {
      console.error("refreshUser error:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, logout, refreshUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}