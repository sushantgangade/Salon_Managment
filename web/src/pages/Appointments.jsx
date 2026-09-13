import { useEffect, useState } from 'react';
import api from '../api/client';
import { todayStr } from '../utils/date';

export default function Appointments() {
    const [rows, setRows] = useState([]);
    const [clients, setClients] = useState([]);
    const [services, setServices] = useState([]);
    const [staff, setStaff] = useState([]);
    const [err, setErr] = useState('');
    const [form, setForm] = useState({
        clientId: '', serviceId: '', staffId: '', date: todayStr(), startTime: '10:00',
    });

    async function load() {
        const [a, c, s, st] = await Promise.all([
            api.get('/appointments'),
            api.get('/clients'),
            api.get('/services'),
            api.get('/staff'),           // 👈 new
        ]);
        setRows(a.data);
        setClients(c.data);
        setServices(s.data);
        setStaff(st.data);
    }

    useEffect(() => {
        load().catch((e) => setErr(e.response?.data?.message || e.message));
    }, []);

    async function create(e) {
        e.preventDefault();
        setErr('');
        try {
            await api.post('/appointments', form);
            setForm({ ...form, clientId: '', serviceId: '', staffId: '' });
            await load();
        } catch (e) {
            setErr(e.response?.data?.message || 'Create failed');
        }
    }

    const badgeFor = (status) => {
        const map = {
            PENDING: 'pending', CONFIRMED: 'confirmed',
            CANCELLED: 'cancelled', COMPLETED: 'completed',
        };
        return `badge ${map[status] || 'none'}`;
    };

    return (
        <div>
            <h2>Appointments</h2>

            {err && <div className="alert error">{err}</div>}

            <form className="form-row" onSubmit={create}>
                <select
                    value={form.clientId}
                    onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                    required
                >
                    <option value="">Client</option>
                    {clients.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>

                <select
                    value={form.serviceId}
                    onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
                    required
                >
                    <option value="">Service</option>
                    {services.map((s) => (
                        <option key={s._id} value={s._id}>{s.name} ({s.durationMinutes}m)</option>
                    ))}
                </select>

                {/* 👇 replaced the free-text Staff ID input with this dropdown */}
                <select
                    value={form.staffId}
                    onChange={(e) => setForm({ ...form, staffId: e.target.value })}
                    required
                >
                    <option value="">Staff</option>
                    {staff.map((s) => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                </select>

                <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                />
                <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    required
                />

                <button type="submit">Create</button>
            </form>

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th><th>Start</th><th>End</th><th>Client</th>
                            <th>Service</th><th>Staff</th><th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr><td colSpan={7}><div className="empty">No appointments yet.</div></td></tr>
                        ) : rows.map((r) => (
                            <tr key={r._id}>
                                <td>{r.date}</td>
                                <td>{r.startTime}</td>
                                <td>{r.endTime}</td>
                                <td>{r.clientId?.name}</td>
                                <td>{r.serviceId?.name}</td>
                                <td>{r.staffId?.name}</td>
                                <td><span className={badgeFor(r.status)}>{r.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}