import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../utils/useAuth';

/**
 * PrivateRoute – only lets through users with an active session.
 * Redirects unauthenticated visitors to the login page (/).
 *
 * Usage:
 *   <Route path="/dashboard" element={<PrivateRoute><UserDashboard /></PrivateRoute>} />
 */
export function PrivateRoute({ children }) {
    const user = useAuthStore((state) => state.user);
    if (!user) return <Navigate to="/" replace />;
    return children;
}

/**
 * AdminRoute – only lets through users whose role === 'admin'.
 * Redirects non-admins to their dashboard.
 */
export function AdminRoute({ children }) {
    const user = useAuthStore((state) => state.user);
    if (!user) return <Navigate to="/" replace />;
    if (!user.is_admin) return <Navigate to="/dashboard" replace />;
    return children;
}
