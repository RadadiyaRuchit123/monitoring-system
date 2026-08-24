import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { AdminDashboard } from './pages/AdminDashboard';
import { VerificationPanel } from './pages/VerificationPanel';
import { LoadingSpinner } from './components/LoadingState';

// Protected Route Guard for logged-in users with active profile
const ProtectedRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();
  if (loading) return <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LoadingSpinner label="Authenticating session..." /></div>;
  if (!user || !profile || profile.role === 'removed') return <Navigate to="/login" replace />;
  return children;
};

// Admin Route Guard (Owner / Admin only)
const AdminRoute = ({ children }) => {
  const { user, profile, isAdmin, loading } = useAuth();
  if (loading) return <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LoadingSpinner label="Verifying admin credentials..." /></div>;
  if (!user || !profile || profile.role === 'removed') return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};

// Office Staff Route Guard (ONLY Office Staff can access)
const OfficeStaffRoute = ({ children }) => {
  const { user, profile, isOfficeStaff, loading } = useAuth();
  if (loading) return <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LoadingSpinner label="Verifying credentials..." /></div>;
  if (!user || !profile || profile.role === 'removed') return <Navigate to="/login" replace />;
  if (!isOfficeStaff) return <Navigate to="/dashboard" replace />;
  return children;
};

// Public Route Guard (Redirects away from Login/Signup if already logged in)
const PublicRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();
  if (loading) return <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LoadingSpinner label="Checking session..." /></div>;
  if (user && profile && profile.role !== 'removed') return <Navigate to="/dashboard" replace />;
  return children;
};

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

          {/* Ground Staff Dashboard */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* ONLY Office Staff: Verification Panel */}
          <Route path="/verify" element={<OfficeStaffRoute><VerificationPanel /></OfficeStaffRoute>} />

          {/* ONLY OWNER: Control Center */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
