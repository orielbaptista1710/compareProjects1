//components/ProtectedRoute.js
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import API from '../api'; 
import toast from 'react-hot-toast';

 
const ProtectedRoute = ({ children, roles }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [unauthorized, setUnauthorized] = useState(false);


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await API.get('/api/auth/me', { withCredentials: true });
        setUser(data.user);
      } catch (err) {
        if (err.response?.status === 403) {
          toast.error('Your account has been deactivated. Contact admin.');
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);


  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />; // if user is not logged in, redirect to login page
  if (roles && !roles.includes(user.role)) { // if user does not have the required role, redirect to home page
    toast.error("You don't have permission to access that page.");
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
