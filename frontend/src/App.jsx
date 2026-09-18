import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AuthLayout from './components/layout/AuthLayout';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';

import TripsPage from './pages/trips/TripsPage';
import TripFormPage from './pages/trips/TripFormPage';
import TripDetailPage from './pages/trips/TripDetailPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import TripReportPage from './pages/reports/TripReportPage';
import ProfilePage from './pages/ProfilePage';

/**
 * TravelMate — Root Application Component
 * Sets up routing with auth-guarded and public routes.
 */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes — Auth layout */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Protected routes — App layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            
            {/* Trip Routes */}
            <Route path="/trips" element={<TripsPage />} />
            <Route path="/trips/new" element={<TripFormPage />} />
            <Route path="/trips/:id" element={<TripDetailPage />} />
            <Route path="/trips/:id/edit" element={<TripFormPage />} />
            <Route path="/trips/:id/report" element={<TripReportPage />} />
            
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
