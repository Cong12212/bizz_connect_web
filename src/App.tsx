import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Auth from './pages/AuthPortal';
import VerifyEmail from './pages/VerifyEmail';
import VerifiedRoute from './components/VerifiedRoute';
import GuestRoute from './components/GuestRoute';
import HomePage from './pages/Dashboard';
import VerifySuccess from './pages/VerifySuccess';
import ResetVerify from './pages/ResetVerify';
import ContactsPage from './pages/Contacts';
import TagsPage from './pages/Tags';
import RemindersPage from './pages/Reminders';
import NotificationsPage from './pages/Notifications';
import SettingsPage from './pages/Setting';
import VerifyOnlyRoute from './components/VerifyOnlyRoute';
import NotFoundPage from './pages/NotFound';
import PublicBusinessCardPage from "./pages/PublicBusinessCard";
import AIChatWidget from './components/ai-chat/AIChatWidget';
import LandingPage from './pages/LandingPage';

export default function App() {
  const location = useLocation();
  const hideChatWidgetPaths = [
    '/auth',
    '/verify-email',
    '/verify-success',
    '/reset-verify',
  ];

  // ✅ Check xem có hiển thị chat widget không
  const shouldShowChatWidget = !hideChatWidgetPaths.includes(location.pathname);

  return (
    <>
      <Routes>
        {/* ✅ Landing page - trang chủ */}
        <Route path="/" element={<LandingPage />} />

        {/* Public routes */}
        <Route path="/card/:slug" element={<PublicBusinessCardPage />} />

        {/* Chỉ KHÁCH (không token) */}
        <Route path="/auth" element={<GuestRoute><Auth /></GuestRoute>} />

        {/* Chỉ người CÓ token nhưng CHƯA verified */}
        <Route path="/verify-email" element={<VerifyOnlyRoute><VerifyEmail /></VerifyOnlyRoute>} />
        <Route path="/verify-success" element={<VerifyOnlyRoute><VerifySuccess /></VerifyOnlyRoute>} />
        <Route path="/reset-verify" element={<VerifyOnlyRoute><ResetVerify /></VerifyOnlyRoute>} />

        {/* Khu vực cần CÓ token & ĐÃ verified */}
        <Route path="/dashboard" element={<VerifiedRoute><HomePage /></VerifiedRoute>} />
        <Route path="/contacts" element={<VerifiedRoute><ContactsPage /></VerifiedRoute>} />
        <Route path="/contacts/:id" element={<VerifiedRoute><ContactsPage /></VerifiedRoute>} />
        <Route path="/tags" element={<VerifiedRoute><TagsPage /></VerifiedRoute>} />
        <Route path="/reminders" element={<VerifiedRoute><RemindersPage /></VerifiedRoute>} />
        <Route path="/notifications" element={<VerifiedRoute><NotificationsPage /></VerifiedRoute>} />
        <Route path="/settings" element={<VerifiedRoute><SettingsPage /></VerifiedRoute>} />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {shouldShowChatWidget && <AIChatWidget />}
    </>
  );
}