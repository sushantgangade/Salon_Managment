import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Clients() {
    const [rows, setRows] = useState([]);
    const [form, setForm] = useState({ name: '', phone: '', email: '' });
    const [err, setErr] = useState('');

    async function load() {
        const { data } = await api.get('/clients');
        setRows(data);
    }

    useEffect(() => { load().catch((e) => setErr(e.message)); }, []);

    async function create(e) {
        e.preventDefault();
        setErr('');
        try {
            await api.post('/clients', form);
            setForm({ name: '', phone: '', email: '' });
            await load();
        } catch (e) {
            setErr(e.response?.data?.message || 'Create failed');
        }
    }

    return (
        <div>
            <h2>Clients</h2>

            {err && <div className="alert error">{err}</div>}

            <form className="form-row" onSubmit={create}>
                <input placeholder="Name" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                <input placeholder="Phone" value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <input placeholder="Email" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <button type="submit">Add Client</button>
            </form>

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr><th>Name</th><th>Phone</th><th>Email</th></tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr><td colSpan={3}><div className="empty">No clients yet.</div></td></tr>
                        ) : rows.map((c) => (
                            <tr key={c._id}>
                                <td>{c.name}</td>
                                <td>{c.phone || <span className="muted">—</span>}</td>
                                <td>{c.email || <span className="muted">—</span>}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}