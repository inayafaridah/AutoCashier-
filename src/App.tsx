/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import * as React from 'react';
import {AuthProvider, useAuth} from './shared/context/AuthContext';
import {LocationProvider} from './shared/context/LocationContext';
import { Toaster } from 'sonner';
import { initializeDatabase } from './shared/lib/database';
import LoginPage from './modules/auth/pages/LoginPage';
import DashboardLayout from './shared/components/layout/DashboardLayout';
import OverviewPage from './modules/dashboard/pages/OverviewPage';
import InventoryPage from './modules/inventory/pages/InventoryPage';
import AddInventoryPage from './modules/inventory/pages/AddInventoryPage';
import PromoPage from './modules/promos/pages/PromoPage';
import CreatePromoPage from './modules/promos/pages/CreatePromoPage';
import UsersPage from './modules/users/pages/UsersPage';
import BroadcastPage from './modules/broadcasts/pages/BroadcastPage';
import AIAnalysisPage from './modules/dashboard/pages/AIAnalysisPage';
import AIInsightsPage from './modules/dashboard/pages/AIInsightsPage';
import MasterProductsPage from './modules/products/pages/MasterProductsPage';
import AddProductPage from './modules/products/pages/AddProductPage';
import MonitorPage from './modules/monitor/pages/MonitorPage';
import BroadcastInboxPage from './modules/broadcasts/pages/BroadcastInboxPage';
import ProfilePage from './modules/users/pages/ProfilePage';
import TransactionsPage from './modules/transactions/pages/TransactionsPage';
import ReportPage from './modules/dashboard/pages/ReportPage';
import {TooltipProvider} from './shared/components/ui/tooltip';

// Wrapper for layout with Sidebar/Header
const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <LocationProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </LocationProvider>
  );
};

// Wrapper for standalone protected pages (No Sidebar/Header)
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Wrapper for role-based access control
const RoleGuard = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: ('super_admin' | 'branch_admin' | 'admin')[] }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  
  const hasAccess = allowedRoles.includes(user.role);
  if (!hasAccess) {
    return <Navigate to="/overview" replace />;
  }
  
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {/* Shared Routes */}
      <Route path="/overview" element={<ProtectedLayout><OverviewPage /></ProtectedLayout>} />
      <Route path="/monitor" element={<ProtectedLayout><RoleGuard allowedRoles={['super_admin']}><MonitorPage /></RoleGuard></ProtectedLayout>} />
      <Route path="/promo" element={<ProtectedLayout><PromoPage /></ProtectedLayout>} />
      <Route path="/promo/create" element={<ProtectedLayout><CreatePromoPage /></ProtectedLayout>} />
      <Route path="/promo/edit/:id" element={<ProtectedLayout><CreatePromoPage /></ProtectedLayout>} />
      <Route path="/inbox" element={<ProtectedLayout><BroadcastInboxPage /></ProtectedLayout>} />
      <Route path="/profile" element={<AuthGuard><ProfilePage /></AuthGuard>} />
      
      {/* Super Admin Only */}
      <Route path="/catalog" element={<ProtectedLayout><RoleGuard allowedRoles={['super_admin']}><MasterProductsPage /></RoleGuard></ProtectedLayout>} />
      <Route path="/master-products" element={<ProtectedLayout><RoleGuard allowedRoles={['super_admin']}><MasterProductsPage /></RoleGuard></ProtectedLayout>} />
      <Route path="/add-product" element={<ProtectedLayout><RoleGuard allowedRoles={['super_admin']}><AddProductPage /></RoleGuard></ProtectedLayout>} />
      <Route path="/users" element={<ProtectedLayout><RoleGuard allowedRoles={['super_admin', 'admin', 'branch_admin']}><UsersPage /></RoleGuard></ProtectedLayout>} />
      <Route path="/broadcast" element={<ProtectedLayout><RoleGuard allowedRoles={['super_admin']}><BroadcastPage /></RoleGuard></ProtectedLayout>} />
      <Route path="/insights" element={<ProtectedLayout><RoleGuard allowedRoles={['super_admin']}><AIInsightsPage /></RoleGuard></ProtectedLayout>} />
      <Route path="/settings" element={<ProtectedLayout><RoleGuard allowedRoles={['super_admin']}><UsersPage /></RoleGuard></ProtectedLayout>} />

      {/* Branch Admin Only */}
      <Route path="/inventory" element={<ProtectedLayout><RoleGuard allowedRoles={['admin', 'branch_admin']}><InventoryPage /></RoleGuard></ProtectedLayout>} />
      <Route path="/inventory/add" element={<ProtectedLayout><RoleGuard allowedRoles={['admin', 'branch_admin']}><AddInventoryPage /></RoleGuard></ProtectedLayout>} />
      <Route path="/analysis" element={<ProtectedLayout><RoleGuard allowedRoles={['admin', 'branch_admin']}><AIAnalysisPage /></RoleGuard></ProtectedLayout>} />

      {/* Transactions — Super Admin sees all, Branch Admin sees their branch */}
      <Route path="/transactions" element={<ProtectedLayout><RoleGuard allowedRoles={['super_admin', 'branch_admin', 'admin']}><TransactionsPage /></RoleGuard></ProtectedLayout>} />

      {/* Report — standalone print view, no sidebar */}
      <Route path="/report" element={<AuthGuard><ReportPage /></AuthGuard>} />

      <Route path="/" element={<Navigate to="/overview" replace />} />
    </Routes>
  );
}

export default function App() {
  React.useEffect(() => {
    // Initialize database connection on app mount
    initializeDatabase().catch(err => console.error('Database initialization error:', err));
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <AppRoutes />
          <Toaster position="top-right" expand={false} richColors />
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
