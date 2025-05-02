import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
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

  const addToCompare = (property) => {
    if (!compareList.some((item) => item._id === property._id)) {
      if (compareList.length < 4) {
        setCompareList([...compareList, property]);
      } else {
        alert("You can only compare up to 4 properties.");
      }
    } else {
      alert("This property is already in the comparison list.");
    }
  };

  const removeFromCompare = (propertyId) => {
    setCompareList(compareList.filter(p => p._id !== propertyId));
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Header />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/properties" element={
            <Properties
              addToCompare={addToCompare}
              compareList={compareList}
              removeFromCompare={removeFromCompare}
            />
          } />
          <Route path="/compare" element={
            <Compare
              compareList={compareList}
              setCompareList={setCompareList}
            />
          } />
          <Route path="/property/:id" element={<PropertyPage />} />
          <Route path="/login" element={<LoginPage />} />

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