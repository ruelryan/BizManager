import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Sales } from './pages/Sales';
import { Products } from './pages/Products';
import { Inventory } from './pages/Inventory';
import { Expenses } from './pages/Expenses';
import { Invoices } from './pages/Invoices';
import { Reports } from './pages/Reports';
import { Profile } from './pages/Profile';
import { Pricing } from './pages/Pricing';
import { Upgrade } from './pages/Upgrade';
import { Login } from './pages/Login';
import { Landing } from './pages/Landing';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Features } from './pages/Features';
import { Demo } from './pages/Demo';
import { Integrations } from './pages/Integrations';
import { ProductLabelDemo } from './pages/ProductLabelDemo';
import { Customers } from './pages/Customers';
import { useStore } from './store/useStore';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProductTour } from './components/ProductTour';

function App() {
  const { user, isLoading, isInitialized, signIn } = useStore();
  const [showTour, setShowTour] = useState(false);
  const [forceShow, setForceShow] = useState(false);
  
  // Debug logging
  useEffect(() => {
    console.log('App Debug:', { user, isLoading, isInitialized, forceShow });
  }, [user, isLoading, isInitialized, forceShow]);
  
  // Check URL parameters for tour
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tour') === 'true') {
      setShowTour(true);
    }
  }, []);

  // Force show app after 3 seconds to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('Force showing app after 3 seconds');
      setForceShow(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Auto-login demo user if not logged in and initialized
  // useEffect(() => {
  //   if (isInitialized && !user && !isLoading && forceShow) {
  //     console.log('Auto-logging in demo user...');
  //     signIn('demo@businessmanager.com', 'demo123', 'pro').catch(console.error);
  //   }
  // }, [isInitialized, user, isLoading, forceShow, signIn]);

  // Show loading spinner while initializing auth (but not longer than 3 seconds)
  if ((!isInitialized || isLoading) && !forceShow) {
    console.log('Showing loading spinner');
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            <p className="text-xs text-gray-500 mt-2">Debug: Loading={isLoading ? 'true' : 'false'}, Init={isInitialized ? 'true' : 'false'}</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  console.log('Rendering main app');

  return (
    <ThemeProvider>
      <Router>
        {showTour && <ProductTour />}
        <Routes>
          {/* Public Routes */}
          <Route path="/landing" element={<Landing />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/features" element={<Features />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/integrations" element={<Integrations />} />
          
          {/* Redirect root to landing if not authenticated, dashboard if authenticated */}
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/landing" />} />
          
          {/* Fallback route */}
          <Route path="*" element={
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">BizManager</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Page not found or routing issue</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  User: {user ? 'Authenticated' : 'Not authenticated'} | 
                  Path: {window.location.pathname}
                </p>
                <div className="mt-4">
                  <a href="/landing" className="text-blue-600 hover:underline mr-4">Go to Landing</a>
                  <a href="/login" className="text-blue-600 hover:underline">Go to Login</a>
                </div>
              </div>
            </div>
          } />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={user ? <Layout /> : <Navigate to="/login" />}>
            <Route index element={<Dashboard />} />
          </Route>
          <Route path="/sales" element={user ? <Layout /> : <Navigate to="/login" />}>
            <Route index element={<Sales />} />
          </Route>
          <Route path="/products" element={user ? <Layout /> : <Navigate to="/login" />}>
            <Route index element={<Products />} />
          </Route>
          <Route path="/customers" element={user ? <Layout /> : <Navigate to="/login" />}>
            <Route index element={<Customers />} />
          </Route>
          <Route path="/inventory" element={user ? <Layout /> : <Navigate to="/login" />}>
            <Route index element={<Inventory />} />
          </Route>
          <Route path="/expenses" element={user ? <Layout /> : <Navigate to="/login" />}>
            <Route index element={<Expenses />} />
          </Route>
          <Route path="/invoices" element={user ? <Layout /> : <Navigate to="/login" />}>
            <Route index element={<Invoices />} />
          </Route>
          <Route path="/reports" element={user ? <Layout /> : <Navigate to="/login" />}>
            <Route index element={<Reports />} />
          </Route>
          <Route path="/profile" element={user ? <Layout /> : <Navigate to="/login" />}>
            <Route index element={<Profile />} />
          </Route>
          <Route path="/product-labels" element={user ? <Layout /> : <Navigate to="/login" />}>
            <Route index element={<ProductLabelDemo />} />
          </Route>
          
          {/* Protected Payment Routes - Require authentication */}
          <Route path="/upgrade" element={user ? <Upgrade /> : <Navigate to="/login" state={{ from: '/upgrade' }} />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;