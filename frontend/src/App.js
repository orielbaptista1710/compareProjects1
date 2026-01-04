import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
// import { ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

import { HeadProvider  } from "react-head";
import { CompareProvider, useCompare } from "./contexts/CompareContext";

import LoadingSpinner from './shared/LoadingSpinners/LoadingSpinner';

import Header from './shared/Header/Header';
import Footer from './shared/Footer/Footer';
import NavigationBar from './shared/NavigationBar/NavigationBar';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedCustomerRoute from "./components/ProtectedCustomerRoute";


import ErrorBoundary from './shared/ErrorBoundary/ErrorBoundary';

// contexts
import { AuthProvider } from "./contexts/AuthContext";
import { CityProvider } from "./contexts/CityContext";


// import useCompareList from "./hooks/useCompareList";

const Home = lazy(() => import('./pages/Home/Home'));
const Properties = lazy(() => import('./pages/Properties/Properties'));
const Compare = lazy(() => import('./pages/Compare/Compare'));
const PropertyPage = lazy(() => import('./pages/PropertyPage/PropertyPage'));
const SupportHelp = lazy(() => import('./pages/SupportAndHelp/SupportHelp'));
const Interiors = lazy(() => import('./pages/HomeInteriors/Interiors'));
const UpnaLoan = lazy(() => import('./pages/UupnaLoans/UpnaLoansHome'));
const PropertyGuide = lazy(() => import('./pages/PropertyGuideBlog/PropertyGuide'));
const ErrorPage = lazy(() => import("./pages/ErrorPage"));
 
const LoginPage = lazy(() => import('./pages/Auth/DeveloperAdminAuth/LoginPage'));
const CustomerSignupPage = lazy(() => import('./pages/Auth/CustomerAuth/CustomerSignupPage'));
const CustomerLoginPage = lazy(() => import('./pages/Auth/CustomerAuth/CustomerLoginPage'));
const CustomerProfilePage = lazy(() => import('./pages/CustomerProfileDashboard/CustomerProfilePage')); 
const Dashboard = lazy(() => import('./pages/DeveloperDashboard/Dashboard'));
const AdminDashboard = lazy(() => import('../src/pages/Admin/AdminDashboard'));



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
  const { compareList, setCompareList, addToCompare, removeFromCompare } = useCompare();
  const location = useLocation();

  const hideNavRoutes = [
  "/properties",
  "/compare",
  "/login",
  "/dashboard",
  "/admin",
  "/customer-signup",
  "/customer-login",
  "/customer-profile",
];

const showNavigationBar = !hideNavRoutes.some((path) =>
  location.pathname.startsWith(path)
);


  return (
    <>
      <Header compareCount={compareList.length} />
      {showNavigationBar && <NavigationBar />}

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
        <Route path="/supportHelp" element={<SupportHelp />} />
        <Route path="/interior" element={<Interiors />} />
        <Route path="/apnaloan" element={<UpnaLoan />} />
        <Route path="/property-guide" element={<PropertyGuide />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/customer-signup" element={<CustomerSignupPage />} />
        <Route path="/customer-login" element={<CustomerLoginPage />} />
        
        {/* 🔐 Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute roles={['user', 'admin']}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute roles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />    
        <Route path="/customer-profile" element={
          <ProtectedCustomerRoute>
            <CustomerProfilePage />
          </ProtectedCustomerRoute>
        } />     

        <Route path="*" element={<ErrorPage />} />
      </Routes>

      </Suspense>

      <Footer />

    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>    
    <HeadProvider > 
    <AuthProvider>
    <CompareProvider>
    <CityProvider> 
    <ErrorBoundary>
    <Router>
              <AppContent />
    </Router>
    </ErrorBoundary>
    </CityProvider>
    </CompareProvider>
    </AuthProvider>
    {process.env.NODE_ENV === "development" && <ReactQueryDevtools />}
    </HeadProvider >
  </QueryClientProvider>
);

export default App;
