import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

const ProtectedCustomerRoute = ({ children }) => {
  
  const { currentUser, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  return currentUser ? children : <Navigate to="/customer-login" replace />;
};

export default ProtectedCustomerRoute; 
