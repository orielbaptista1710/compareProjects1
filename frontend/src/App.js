import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Properties from './pages/Properties';
import Compare from './pages/Compare';
import PropertyPage from './pages/PropertyPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import SupportHelp from './pages/SupportHelp';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  const [compareList, setCompareList] = useState([]);

  // Load compare list from localStorage on component mount
  useEffect(() => {
    const savedCompareList = localStorage.getItem('compareList');
    if (savedCompareList) {
      try {
        setCompareList(JSON.parse(savedCompareList));
      } catch (error) {
        console.error('Error parsing compare list from localStorage:', error);
      }
    }
  }, []);

  // Save compare list to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('compareList', JSON.stringify(compareList));
  }, [compareList]);

  const addToCompare = (property) => {
    const normalizeId = (id) => {
      if (!id) return null;
      // Handle both string and ObjectId formats
      if (typeof id === 'object' && id.$oid) {
        return id.$oid;
      }
      return id.toString();
    };

    const normalizedPropertyId = normalizeId(property._id);
    
    if (compareList.some(item => normalizeId(item._id) === normalizedPropertyId)) {
      // Property already in comparison, remove it
      setCompareList(prev => prev.filter(item => normalizeId(item._id) !== normalizedPropertyId));
      return false;
    }
    
    if (compareList.length >= 4) {
      alert("You can only compare up to 4 properties.");
      return false;
    }
    
    setCompareList(prev => [...prev, property]);
    return true;
  };

  const removeFromCompare = (propertyId) => {
    setCompareList(prev => prev.filter(item => {
      const normalizeId = (id) => {
        if (!id) return null;
        if (typeof id === 'object' && id.$oid) return id.$oid;
        return id.toString();
      };
      return normalizeId(item._id) !== normalizeId(propertyId);
    }));
  };

  // const clearCompareList = () => {
  //   setCompareList([]);
  // };

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Header compareCount={compareList.length} />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/properties" element={
            <Properties
              addToCompare={addToCompare}
              removeFromCompare={removeFromCompare}
              compareList={compareList}
            />
          } />
          <Route path="/compare" element={
            <Compare
              compareList={compareList}
              setCompareList={setCompareList}
              removeFromCompare={removeFromCompare}
            />
          } />
          <Route path="/property/:id" element={<PropertyPage addToCompare={addToCompare} compareList={compareList} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/supportHelp" element={<SupportHelp />} />
          
          {/* 🔐 Protected Route */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />         

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        <Footer />
      </Router>
      
      {/* Add React Query Devtools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

export default App;