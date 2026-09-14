import React, { useState } from 'react';
import { HashRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AiAssistant from './pages/AiAssistant';
import Schemes from './pages/Schemes';
import ReportIssue from './pages/ReportIssue';
import ComplaintTracker from './pages/ComplaintTracker';
import DocumentAssistant from './pages/DocumentAssistant';
import NearbyOffices from './pages/NearbyOffices';
import Emergency from './pages/Emergency';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Admin from './pages/Admin';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Layout wrapper for all authenticated dashboard screens
function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex pt-16 h-screen overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Main scrollable page workspace */}
        <main className="flex-1 overflow-y-auto px-6 py-8 md:pl-72 transition-all duration-300">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="ai" element={<AiAssistant />} />
          <Route path="schemes" element={<Schemes />} />
          <Route path="report" element={<ReportIssue />} />
          <Route path="track" element={<ComplaintTracker />} />
          <Route path="locker" element={<DocumentAssistant />} />
          <Route path="offices" element={<NearbyOffices />} />
          <Route path="emergency" element={<Emergency />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          
          {/* Admin Protected Route */}
          <Route 
            path="admin" 
            element={
              <ProtectedRoute adminOnly>
                <Admin />
              </ProtectedRoute>
            } 
          />
        </Route>

        {/* Catch-all redirect to Landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
