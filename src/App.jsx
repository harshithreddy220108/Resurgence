import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute, AdminRoute } from './components/PrivateRoute';

import Login from './pages/Login';
import RegisterPage from './pages/RegisterPage';
import UserDashboard from './pages/UserDashboard';
import TradePage from './pages/TradePage';
import TransactionHistory from './pages/TransactionHistory';
import ImpactPage from './pages/ImpactPage';
import SunSyncPage from './pages/SunSyncPage';
import MarketplacePage from './pages/MarketplacePage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import AdminListings from './pages/AdminListings';
import AdminMatches from './pages/AdminMatches';
import AdminUsers from './pages/AdminUsers';
import AdminSdgReport from './pages/AdminSdgReport';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Public ── */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ── User (must be logged in) ── */}
        <Route path="/dashboard" element={<PrivateRoute><UserDashboard /></PrivateRoute>} />
        <Route path="/trade" element={<PrivateRoute><TradePage /></PrivateRoute>} />
        <Route path="/history" element={<PrivateRoute><TransactionHistory /></PrivateRoute>} />
        <Route path="/impact" element={<PrivateRoute><ImpactPage /></PrivateRoute>} />
        <Route path="/sunsync" element={<PrivateRoute><SunSyncPage /></PrivateRoute>} />
        <Route path="/market" element={<PrivateRoute><MarketplacePage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

        {/* ── Admin (must be logged in + admin role) ── */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/listings" element={<AdminRoute><AdminListings /></AdminRoute>} />
        <Route path="/admin/matches" element={<AdminRoute><AdminMatches /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/sdg" element={<AdminRoute><AdminSdgReport /></AdminRoute>} />

        {/* ── 404 ── */}
        <Route path="*" element={<NotFoundPage />} />

      </Routes>
    </BrowserRouter>
  );
}
