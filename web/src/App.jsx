import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import Clients from './pages/Clients';
import Subscription from './pages/Subscription';
import Plans from './pages/admin/Plans';
import Salons from './pages/admin/Salons';
import SubscriptionHistory from './pages/admin/SubscriptionHistory';

function Nav() {
    const { user, logout } = useAuth();
    const nav = useNavigate();
    if (!user) return null;

    const isAdmin = user.role === 'SUPER_ADMIN';
    const isOwner = user.role === 'SALON_OWNER';
    const isSalonStaff = user.role === 'SALON_OWNER' || user.role === 'RECEPTIONIST';

    return (
        <nav className="app-nav">
            <span className="brand">Salon CRM</span>
            <Link to="/">Dashboard</Link>
            {isSalonStaff && <Link to="/appointments">Appointments</Link>}
            {isSalonStaff && <Link to="/clients">Clients</Link>}
            {isOwner && <Link to="/subscription">Subscription</Link>}
            {isAdmin && <Link to="/admin/plans">Plans</Link>}
            {isAdmin && <Link to="/admin/salons">Salons</Link>}
            {isAdmin && <Link to="/admin/history">Sub. History</Link>}
            <span className="spacer" />
            <span className="user-chip">
                {user.email} • {user.role}
            </span>
            <button className="secondary" onClick={() => { logout(); nav('/login'); }}>
                Logout
            </button>
        </nav>
    );
}

export default function App() {
    return (
        <div className="app-shell">
            <Nav />
            <main className="app-main">
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

                    <Route path="/appointments" element={
                        <ProtectedRoute roles={['SALON_OWNER', 'RECEPTIONIST']}><Appointments /></ProtectedRoute>
                    } />
                    <Route path="/clients" element={
                        <ProtectedRoute roles={['SALON_OWNER', 'RECEPTIONIST']}><Clients /></ProtectedRoute>
                    } />
                    <Route path="/subscription" element={
                        <ProtectedRoute roles={['SALON_OWNER']}><Subscription /></ProtectedRoute>
                    } />

                    <Route path="/admin/plans" element={
                        <ProtectedRoute roles={['SUPER_ADMIN']}><Plans /></ProtectedRoute>
                    } />
                    <Route path="/admin/salons" element={
                        <ProtectedRoute roles={['SUPER_ADMIN']}><Salons /></ProtectedRoute>
                    } />
                    <Route path="/admin/history" element={
                        <ProtectedRoute roles={['SUPER_ADMIN']}><SubscriptionHistory /></ProtectedRoute>
                    } />

                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>
        </div>
    );
}