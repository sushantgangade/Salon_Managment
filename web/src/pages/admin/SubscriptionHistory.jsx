import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function SubscriptionHistory() {
    const [rows, setRows] = useState([]);

    useEffect(() => {
        api.get('/salons/subscription-history').then((r) => setRows(r.data));
    }, []);

    const badgeFor = (action) => {
        const map = { ASSIGN: 'confirmed', RENEW: 'completed', UPGRADE: 'pending' };
        return `badge ${map[action] || 'none'}`;
    };

    return (
        <div>
            <h2>Subscription History</h2>

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>When</th><th>Salon</th><th>Plan</th><th>Action</th>
                            <th>Start</th><th>End</th><th>Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr><td colSpan={7}><div className="empty">No records.</div></td></tr>
                        ) : rows.map((h) => (
                            <tr key={h._id}>
                                <td>{new Date(h.createdAt).toLocaleString()}</td>
                                <td>{h.salonId?.name}</td>
                                <td>{h.planId?.name}</td>
                                <td><span className={badgeFor(h.action)}>{h.action}</span></td>
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