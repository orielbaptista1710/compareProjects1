import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import LoadingSpinner from './components/LoadingSpinner';
import './components/LoadingSpinner.css';

import Header from './components/Header';
import Footer from './components/Footer';
import NavigationBar from './components/NavigationBar';
import ProtectedRoute from './components/ProtectedRoute';


import ErrorBoundary from './components/ErrorBoundary';

import useCompareList from "./hooks/useCompareList";

const Home = lazy(() => import('./pages/Home'));
const Properties = lazy(() => import('./pages/Properties'));
const Compare = lazy(() => import('./pages/Compare'));
const PropertyPage = lazy(() => import('./pages/PropertyPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const SupportHelp = lazy(() => import('./pages/SupportHelp'));
const Interiors = lazy(() => import('./pages/Interiors'));
const ApnaLoan = lazy(() => import('./pages/ApnaLoansHome'));



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

const AppContent = () => {   // ✅ fixed function syntax
  const { compareList, setCompareList, addToCompare, removeFromCompare } = useCompareList();
  const location = useLocation();

  const hideNavRoutes = ["/properties", "/compare", "/login"];
  const showNavigationBar = !hideNavRoutes.some((route) =>
    location.pathname.startsWith(route)
  );

  return (
    <>
      <Header compareCount={compareList.length} />
      {showNavigationBar && <NavigationBar />}

      <ErrorBoundary>
        <Suspense fallback={
          <div className="spinner-container">
            <LoadingSpinner size="lg" text="Loading page..." />
          </div>
        }>

        
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
            setCompareList={setCompareList}   // ✅ now works
            removeFromCompare={removeFromCompare}
          />
        } />
        <Route path="/property/:id" element={<PropertyPage addToCompare={addToCompare} compareList={compareList} />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/supportHelp" element={<SupportHelp />} />
        <Route path="/interior" element={<Interiors />} />
        <Route path="/apnaloan" element={<ApnaLoan />} />
        
        {/* 🔐 Protected Routes */}
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

      </Suspense>
      </ErrorBoundary>

      <Footer />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Router>
      <AppContent />
    </Router>
    {process.env.NODE_ENV === "development" && <ReactQueryDevtools />}
  </QueryClientProvider>
);

export default App;
