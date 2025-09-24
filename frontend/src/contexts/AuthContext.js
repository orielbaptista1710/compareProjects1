// AUTH for Csutomer Loginn for Header and CustomerProfilePage
//src/contexts/AuthContext.js
import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("customerToken");
    if (!token) {
      setLoading(false);
      return;
    }

    fetch("http://localhost:5000/api/customers/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Invalid/expired token");
        const data = await res.json();
        setCurrentUser(data.customer);
      })
      .catch(() => localStorage.removeItem("customerToken"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
