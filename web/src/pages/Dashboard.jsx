import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
    const { user } = useAuth();
    const [count, setCount] = useState(null);
    const [sub, setSub] = useState(null);
    const [att, setAtt] = useState(null);

    useEffect(() => {
        if (user.role === 'SUPER_ADMIN') return;
        api.get('/appointments/today/count').then((r) => setCount(r.data.count)).catch(() => { });
        if (user.role === 'SALON_OWNER') {
            api.get('/salons/me/subscription').then((r) => setSub(r.data.salon)).catch(() => { });
        }
        api.get('/attendance/today').then((r) => setAtt(r.data)).catch(() => { });
    }, [user]);

    if (user.role === 'SUPER_ADMIN') {
        return (
            <div>
                <h2>Super Admin Dashboard</h2>
                <div className="card">
                    <p className="muted">
                        Use the top navigation to manage <strong>Plans</strong>, <strong>Salons</strong>, and
                        view global <strong>Subscription History</strong>.
                    </p>
                </div>
            </div>
        );
    }

    const subBadgeClass =
        sub?.subscriptionStatus === 'ACTIVE' ? 'active'
            : sub?.subscriptionStatus === 'EXPIRED' ? 'expired'
                : 'none';

    return (
        <div>
            <h2>Dashboard</h2>

            <div className="stat-grid">
                <div className="stat">
                    <div className="stat-label">Today&apos;s Appointments</div>
                    <div className="stat-value">{count ?? '—'}</div>
                </div>

                {sub && (
                    <div className="stat">
                        <div className="stat-label">Subscription</div>
                        <div className="stat-value">
                            <span className={`badge ${subBadgeClass}`}>{sub.subscriptionStatus}</span>
                        </div>
                        {sub.subscriptionEndDate && (
                            <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                                until {new Date(sub.subscriptionEndDate).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                )}

                {att && (
                    <div className="stat">
                        <div className="stat-label">Attendance Today</div>
                        <div className="stat-value">
                            <span className={`badge ${att.checkedIn ? 'completed' : 'pending'}`}>
                                {att.checkedIn ? 'Checked in' : 'Not yet'}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}