import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider } from './features/auth/AuthContext';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { ToastProvider } from './components/ui/Toast';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { OwnerLayout } from './layouts/OwnerLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Public Pages
import { LandingPage } from './pages/landing/LandingPage';
import { OwnerLoginPage } from './pages/auth/OwnerLoginPage';
import { AdminLoginPage } from './pages/auth/AdminLoginPage';
import { UnauthorizedPage } from './pages/auth/UnauthorizedPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { CustomerReviewPage } from './pages/review/CustomerReviewPage';

// Owner Pages
import { OwnerDashboardPage } from './pages/owner/OwnerDashboardPage';
import { OwnerReviewsPage } from './pages/owner/OwnerReviewsPage';
import { OwnerAnalyticsPage } from './pages/owner/OwnerAnalyticsPage';
import { OwnerQRCodePage } from './pages/owner/OwnerQRCodePage';
import { OwnerBusinessPage } from './pages/owner/OwnerBusinessPage';
import { OwnerSettingsPage } from './pages/owner/OwnerSettingsPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminOwnersPage } from './pages/admin/AdminOwnersPage';
import { AdminBusinessesPage } from './pages/admin/AdminBusinessesPage';
import { AdminReviewsPage } from './pages/admin/AdminReviewsPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

// 404 Not Found Page
const NotFoundPage = () => (
  <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
    <span className="text-4xl font-extrabold text-primary mb-2">404</span>
    <h1 className="text-xl font-bold text-slate-900">Page Not Found</h1>
    <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6">
      The requested URL does not exist or has been moved.
    </p>
    <Link
      to="/"
      className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-hover transition-colors"
    >
      Return Home
    </Link>
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Customer Public Flow */}
            <Route path="/review/:businessSlug" element={<CustomerReviewPage />} />

            {/* Public Marketing Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
            </Route>

            {/* Authentication Routes */}
            <Route path="/login" element={<OwnerLoginPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Protected Owner Portal */}
            <Route
              path="/owner"
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <OwnerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/owner/dashboard" replace />} />
              <Route path="dashboard" element={<OwnerDashboardPage />} />
              <Route path="reviews" element={<OwnerReviewsPage />} />
              <Route path="analytics" element={<OwnerAnalyticsPage />} />
              <Route path="qr" element={<OwnerQRCodePage />} />
              <Route path="business" element={<OwnerBusinessPage />} />
              <Route path="settings" element={<OwnerSettingsPage />} />
            </Route>

            {/* Protected Admin Portal */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="owners" element={<AdminOwnersPage />} />
              <Route path="businesses" element={<AdminBusinessesPage />} />
              <Route path="reviews" element={<AdminReviewsPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="audit-logs" element={<AdminAuditLogsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>

            {/* Fallback 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};
