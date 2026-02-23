// src/contexts/AuthContext.js
import { createContext, useState, useEffect } from "react";
import API from "../api"; 

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("customerToken");
    if (!token || currentUser) {
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const { data } = await API.get("/api/customers/me");
        setCurrentUser(data.customer);
      } catch (err) {
        console.error("AuthContext: Invalid or expired token", err);
        localStorage.removeItem("customerToken");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [currentUser]);

  // Central logout
  const logout = () => {
    localStorage.removeItem("customerToken");
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, loading, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
