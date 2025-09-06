import { Navigate } from "react-router-dom";

const ProtectedCustomerRoute = ({ children }) => {
  const token = localStorage.getItem("customerToken");
  if (!token) return <Navigate to="/customer-login" replace />;
  return children;
};

export default ProtectedCustomerRoute;
