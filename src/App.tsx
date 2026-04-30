/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import * as React from 'react';
import {AuthProvider, useAuth} from './context/AuthContext';
import {LocationProvider} from './context/LocationContext';
import { Toaster } from 'sonner';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import OverviewPage from './pages/OverviewPage';
import InventoryPage from './pages/InventoryPage';
import PromoPage from './pages/PromoPage';
import UsersPage from './pages/UsersPage';
import BroadcastPage from './pages/BroadcastPage';
import AIAnalysisPage from './pages/AIAnalysisPage';
import AIInsightsPage from './pages/AIInsightsPage';
import MasterProductsPage from './pages/MasterProductsPage';
import BranchInventoryPage from './pages/BranchInventoryPage';
import BroadcastInboxPage from './pages/BroadcastInboxPage';
import ProfilePage from './pages/ProfilePage';
import {TooltipProvider} from './components/ui/tooltip';

// Wrapper for layout with Sidebar/Header
const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
};

// Wrapper for standalone protected pages (No Sidebar/Header)
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route path="/overview" element={<ProtectedLayout><OverviewPage /></ProtectedLayout>} />
      
      <Route path="/catalog" element={<ProtectedLayout><MasterProductsPage /></ProtectedLayout>} />

      <Route path="/monitor" element={<ProtectedLayout><BranchInventoryPage /></ProtectedLayout>} />

      <Route path="/inventory" element={<ProtectedLayout><InventoryPage /></ProtectedLayout>} />

      <Route path="/users" element={<ProtectedLayout><UsersPage /></ProtectedLayout>} />

      <Route path="/promo" element={<ProtectedLayout><PromoPage /></ProtectedLayout>} />

      <Route path="/broadcast" element={<ProtectedLayout><BroadcastPage /></ProtectedLayout>} />
      
      <Route path="/inbox" element={<ProtectedLayout><BroadcastInboxPage /></ProtectedLayout>} />

      <Route path="/insights" element={<ProtectedLayout><AIInsightsPage /></ProtectedLayout>} />

      <Route path="/analysis" element={<ProtectedLayout><AIAnalysisPage /></ProtectedLayout>} />
      <Route path="/profile" element={<AuthGuard><ProfilePage /></AuthGuard>} />
      <Route path="/settings" element={<ProtectedLayout><UsersPage /></ProtectedLayout>} />

      <Route path="/" element={<Navigate to="/overview" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LocationProvider>
          <TooltipProvider>
            <AppRoutes />
            <Toaster position="top-right" expand={false} richColors />
          </TooltipProvider>
        </LocationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
