import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Sales } from './pages/Sales';
import { Products } from './pages/Products';
import { Inventory } from './pages/Inventory';
import { Expenses } from './pages/Expenses';
import { Reports } from './pages/Reports';
import { Invoices } from './pages/Invoices';
import { Profile } from './pages/Profile';
import { Pricing } from './pages/Pricing';
import { Upgrade } from './pages/Upgrade';
import { Login } from './pages/Login';
import { Landing } from './pages/Landing';
import { useStore } from './store/useStore';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  const { user, isLoading, isInitialized } = useStore();

  // Show loading spinner while initializing auth
  if (!isInitialized || isLoading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/landing" element={<Landing />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/upgrade" element={<Upgrade />} />
          
          {/* Redirect root to landing if not authenticated, dashboard if authenticated */}
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/landing" />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={user ? <Layout /> : <Navigate to="/landing" />}>
            <Route index element={<Dashboard />} />
          </Route>
          <Route path="/sales" element={user ? <Layout /> : <Navigate to="/landing" />}>
            <Route index element={<Sales />} />
          </Route>
          <Route path="/products" element={user ? <Layout /> : <Navigate to="/landing" />}>
            <Route index element={<Products />} />
          </Route>
          <Route path="/inventory" element={user ? <Layout /> : <Navigate to="/landing" />}>
            <Route index element={<Inventory />} />
          </Route>
          <Route path="/expenses" element={user ? <Layout /> : <Navigate to="/landing" />}>
            <Route index element={<Expenses />} />
          </Route>
          <Route path="/invoices" element={user ? <Layout /> : <Navigate to="/landing" />}>
            <Route index element={<Invoices />} />
          </Route>
          <Route path="/reports" element={user ? <Layout /> : <Navigate to="/landing" />}>
            <Route index element={<Reports />} />
          </Route>
          <Route path="/profile" element={user ? <Layout /> : <Navigate to="/landing" />}>
            <Route index element={<Profile />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;