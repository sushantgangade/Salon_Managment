import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE = 'https://salon-managment-yi1q.onrender.com'; // ← YOUR laptop's LAN IP on the same Wi-Fi

async function request(path, { method = 'GET', body } = {}) {
    const token = await AsyncStorage.getItem('token');
    const res = await fetch(`${BASE}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(data.message || 'Request failed');
        err.status = res.status;
        err.data = data;
        throw err;
    }
    return data;
}

export const api = {
    login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
    me: () => request('/auth/me'),
    todayCount: () => request('/appointments/today/count'),
    todayAppointments: () => request('/appointments?date=' + todayStr()),
    todaySubscription: () => request('/salons/me/subscription'),
    attendanceToday: () => request('/attendance/today'),
    checkIn: (latitude, longitude) => request('/attendance/check-in', { method: 'POST', body: { latitude, longitude } }),
};

function todayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export { AsyncStorage };