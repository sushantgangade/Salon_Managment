import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Subscription() {
    const [data, setData] = useState(null);
    const [err, setErr] = useState('');

    useEffect(() => {
        api.get('/salons/me/subscription')
            .then((r) => setData(r.data))
            .catch((e) => setErr(e.response?.data?.message || e.message));
    }, []);

    if (err) return <div className="alert error">{err}</div>;
    if (!data) return <div className="loading">Loading…</div>;

    const { salon, history } = data;
    const badgeClass =
        salon.subscriptionStatus === 'ACTIVE' ? 'active'
            : salon.subscriptionStatus === 'EXPIRED' ? 'expired'
                : 'none';

    return (
        <div>
            <h2>Subscription</h2>

            <div className="stat-grid">
                <div className="stat">
                    <div className="stat-label">Plan</div>
                    <div className="stat-value dim">{salon.currentPlan?.name || '—'}</div>
                </div>
                <div className="stat">
                    <div className="stat-label">Status</div>
                    <div className="stat-value">
                        <span className={`badge ${badgeClass}`}>{salon.subscriptionStatus}</span>
                    </div>
                </div>
                <div className="stat">
                    <div className="stat-label">Start</div>
                    <div className="stat-value dim">
                        {salon.subscriptionStartDate
                            ? new Date(salon.subscriptionStartDate).toLocaleDateString()
                            : '—'}
                    </div>
                </div>
                <div className="stat">
                    <div className="stat-label">End</div>
                    <div className="stat-value dim">
                        {salon.subscriptionEndDate
                            ? new Date(salon.subscriptionEndDate).toLocaleDateString()
                            : '—'}
                    </div>
                </div>
            </div>

            <h3>History</h3>
            <div className="table-wrap">
                <table>
                    <thead>
                        <tr><th>When</th><th>Action</th><th>Plan</th><th>Start</th><th>End</th><th>Price</th></tr>
                    </thead>
                    <tbody>
                        {history.length === 0 ? (
                            <tr><td colSpan={6}><div className="empty">No history.</div></td></tr>
                        ) : history.map((h) => (
                            <tr key={h._id}>
                                <td>{new Date(h.createdAt).toLocaleString()}</td>
                                <td>{h.action}</td>
                                <td>{h.planId?.name}</td>
                                <td>{new Date(h.startDate).toLocaleDateString()}</td>
                                <td>{new Date(h.endDate).toLocaleDateString()}</td>
                                <td>{h.price}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}