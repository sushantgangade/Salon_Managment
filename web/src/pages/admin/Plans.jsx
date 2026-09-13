import { useEffect, useState } from 'react';
import api from '../../api/client';

const empty = { name: '', price: 0, durationInDays: 30, maxStaff: 5, maxAppointments: 200 };

export default function Plans() {
    const [rows, setRows] = useState([]);
    const [form, setForm] = useState(empty);
    const [err, setErr] = useState('');

    async function load() {
        const { data } = await api.get('/plans');
        setRows(data);
    }
    useEffect(() => { load().catch((e) => setErr(e.message)); }, []);

    async function create(e) {
        e.preventDefault();
        setErr('');
        try {
            await api.post('/plans', form);
            setForm(empty);
            await load();
        } catch (e) {
            setErr(e.response?.data?.message || 'Create failed');
        }
    }

    return (
        <div>
            <h2>Plans</h2>

            {err && <div className="alert error">{err}</div>}

            <form className="form-row" onSubmit={create}>
                <input placeholder="Name" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                <input type="number" placeholder="Price" value={form.price}
                    onChange={(e) => setForm({ ...form, price: +e.target.value })} required />
                <input type="number" placeholder="Duration (days)" value={form.durationInDays}
                    onChange={(e) => setForm({ ...form, durationInDays: +e.target.value })} required />
                <input type="number" placeholder="Max Staff" value={form.maxStaff}
                    onChange={(e) => setForm({ ...form, maxStaff: +e.target.value })} required />
                <input type="number" placeholder="Max Appointments" value={form.maxAppointments}
                    onChange={(e) => setForm({ ...form, maxAppointments: +e.target.value })} required />
                <button type="submit">Create Plan</button>
            </form>

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr><th>Name</th><th>Price</th><th>Days</th><th>Max Staff</th><th>Max Appts</th></tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr><td colSpan={5}><div className="empty">No plans yet.</div></td></tr>
                        ) : rows.map((p) => (
                            <tr key={p._id}>
                                <td><strong>{p.name}</strong></td>
                                <td>{p.price}</td>
                                <td>{p.durationInDays}</td>
                                <td>{p.maxStaff}</td>
                                <td>{p.maxAppointments}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}