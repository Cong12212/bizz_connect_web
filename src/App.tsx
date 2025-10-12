import { Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/AuthPortal';
import VerifyEmail from './pages/VerifyEmail';
import VerifiedRoute from './components/VerifiedRoute';
import GuestRoute from './components/GuestRoute';
import HomePage from './pages/Dashboard';
import VerifySuccess from './pages/VerifySuccess';
import ForgotPassword from './pages/ForgotPassword';
import ResetVerify from './pages/ResetVerify';
import ContactsPage from './pages/Contacts';
import TagsPage from './pages/Tags';
import RemindersPage from './pages/Remiders';
import NotificationsPage from './pages/notifications';
import SettingsPage from './pages/Setting';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Khách mới được vào trang auth */}
      <Route
        path="/auth"
        element={
          <GuestRoute>
            <Auth />
          </GuestRoute>
        }
      />

      <Route
        path="/verify-email"
        element={
          <VerifiedRoute>
            <VerifyEmail />
          </VerifiedRoute>
        }
      />

      <Route
        path="/verify-success"
        element={
          <GuestRoute>
            <VerifySuccess />
          </GuestRoute>
        }
      />

      <Route
        path="/forgot-password"
        element={
          <GuestRoute>
            <ForgotPassword />
          </GuestRoute>
        }
      />

      <Route
        path="/reset-verify"
        element={
          <GuestRoute>
            <ResetVerify />
          </GuestRoute>
        }
      />

      {/* Khu vực cần đăng nhập + verified */}
      <Route
        path="/dashboard"
        element={
          <VerifiedRoute>
            <HomePage />
          </VerifiedRoute>
        }
      />
      <Route
        path="/contacts"
        element={
          <VerifiedRoute>
            <ContactsPage />
          </VerifiedRoute>
        }
      />
      <Route
        path="/tags"
        element={
          <VerifiedRoute>
            <TagsPage />
          </VerifiedRoute>
        }
      />
      <Route
        path="/reminders"
        element={
          <VerifiedRoute>
            <RemindersPage />
          </VerifiedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <VerifiedRoute>
            <NotificationsPage />
          </VerifiedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <VerifiedRoute>
            <SettingsPage />
          </VerifiedRoute>
        }
      />

      <Route path="*" element={<div style={{ padding: 24 }}>Not found</div>} />
    </Routes>
  );
}
