import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function Salons() {
    const [salons, setSalons] = useState([]);
    const [plans, setPlans] = useState([]);
    const [selected, setSelected] = useState({});
    const [err, setErr] = useState('');

    async function load() {
        const [s, p] = await Promise.all([api.get('/salons'), api.get('/plans')]);
        setSalons(s.data);
        setPlans(p.data);
    }
    useEffect(() => { load().catch((e) => setErr(e.message)); }, []);

    async function assign(salonId, action) {
        const planId = selected[salonId];
        if (!planId) return alert('Pick a plan first');
        setErr('');
        try {
            await api.post(`/salons/${salonId}/subscription`, { planId, action });
            await load();
        } catch (e) {
            setErr(e.response?.data?.message || 'Assign failed');
        }
    }

    const badgeFor = (status) => {
        const map = { ACTIVE: 'active', EXPIRED: 'expired', NONE: 'none' };
        return `badge ${map[status] || 'none'}`;
    };

    return (
        <div>
            <h2>Salons</h2>

            {err && <div className="alert error">{err}</div>}

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th><th>Plan</th><th>Status</th><th>Ends</th><th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {salons.length === 0 ? (
                            <tr><td colSpan={5}><div className="empty">No salons.</div></td></tr>
                        ) : salons.map((s) => (
                            <tr key={s._id}>
                                <td><strong>{s.name}</strong></td>
                                <td>{s.currentPlan?.name || <span className="muted">—</span>}</td>
                                <td><span className={badgeFor(s.subscriptionStatus)}>{s.subscriptionStatus}</span></td>
                                <td>
                                    {s.subscriptionEndDate
                                        ? new Date(s.subscriptionEndDate).toLocaleDateString()
                                        : <span className="muted">—</span>}
                                </td>
                                <td>
                                    <div className="btn-row">
                                        <select
                                            value={selected[s._id] || ''}
                                            onChange={(e) => setSelected({ ...selected, [s._id]: e.target.value })}
                                        >
                                            <option value="">Select plan</option>
                                            {plans.map((p) => (
                                                <option key={p._id} value={p._id}>
                                                    {p.name} • {p.durationInDays}d • {p.price}
                                                </option>
                                            ))}
                                        </select>
                                        <button className="secondary" onClick={() => assign(s._id, 'ASSIGN')}>Assign</button>
                                        <button className="secondary" onClick={() => assign(s._id, 'RENEW')}>Renew</button>
                                        <button className="secondary" onClick={() => assign(s._id, 'UPGRADE')}>Upgrade</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}