import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { login } = useAuth();
    const nav = useNavigate();
    const [email, setEmail] = useState('owner@salon.test');
    const [password, setPassword] = useState('owner123');
    const [err, setErr] = useState('');

    async function onSubmit(e) {
        e.preventDefault();
        setErr('');
        try {
            await login(email, password);
            nav('/');
        } catch (e) {
            setErr(e.response?.data?.message || 'Login failed');
        }
    }

    return (
        <div className="login-page">
            <form className="login-card" onSubmit={onSubmit}>
                <h2>Sign in to Salon CRM</h2>

                {err && <div className="alert error">{err}</div>}

                <div className="field">
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@salon.test"
                        autoComplete="username"
                    />
                </div>

                <div className="field">
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
                    />
                </div>

                <button type="submit">Sign in</button>

                <div className="login-hint">
                    <div><strong>Demo logins</strong></div>
                    <div>Super Admin: <code>admin@salon.test</code> / <code>admin123</code></div>
                    <div>Owner: <code>owner@salon.test</code> / <code>owner123</code></div>
                    <div>Receptionist: <code>reception@salon.test</code> / <code>recep123</code></div>
                </div>
            </form>
        </div>
    );
}