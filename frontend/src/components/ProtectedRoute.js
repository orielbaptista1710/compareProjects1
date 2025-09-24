// src/components/ProtectedRoute.js
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, roles }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  // No token → redirect to login
  if (!token) {
    return <Navigate to="/login" />;
  }

  // If roles are specified and user role is not in them → redirect home (or 403 page)
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  } 

  return children;
};

export default ProtectedRoute;
