import { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function DashboardScreen({ navigation }) {
    const { user, logout } = useAuth();
    const [count, setCount] = useState(null);
    const [sub, setSub] = useState(null);
    const [att, setAtt] = useState(null);
    const [err, setErr] = useState('');

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;

            async function load() {
                setErr('');
                // Fetch independently so one 403 doesn't kill the whole dashboard.
                try {
                    const c = await api.todayCount();
                    if (!cancelled) setCount(c.count);
                } catch (e) {
                    if (!cancelled) setErr(e.message);
                }

                try {
                    const a = await api.attendanceToday();
                    if (!cancelled) setAtt(a);
                } catch { /* attendance may be empty — ignore */ }

                if (user.role === 'SALON_OWNER') {
                    try {
                        const s = await api.todaySubscription();
                        if (!cancelled) setSub(s.salon);
                    } catch { /* subscription is OWNER-only; ignore if it fails */ }
                }
            }

            load();
            return () => { cancelled = true; };
        }, [user])
    );

    const subColor =
        sub?.subscriptionStatus === 'ACTIVE' ? '#059669'
            : sub?.subscriptionStatus === 'EXPIRED' ? '#dc2626'
                : '#6b7280';

    return (
        <ScrollView contentContainerStyle={s.wrap}>
            <Text style={s.h}>Hi, {user.name}</Text>
            <Text style={s.role}>{user.role}</Text>

            {err ? <Text style={s.err}>{err}</Text> : null}

            <View style={s.card}>
                <Text style={s.label}>Today's Appointments</Text>
                <Text style={s.value}>{count ?? '—'}</Text>
            </View>

            {user.role === 'SALON_OWNER' && (
                <View style={s.card}>
                    <Text style={s.label}>Subscription</Text>
                    <Text style={[s.value, { color: subColor, fontSize: 20 }]}>
                        {sub?.subscriptionStatus ?? '—'}
                    </Text>
                    {sub?.subscriptionEndDate && (
                        <Text style={s.sub}>until {new Date(sub.subscriptionEndDate).toLocaleDateString()}</Text>
                    )}
                </View>
            )}

            <View style={s.card}>
                <Text style={s.label}>Attendance Today</Text>
                <Text style={[s.value, { color: att?.checkedIn ? '#059669' : '#d97706', fontSize: 20 }]}>
                    {att?.checkedIn ? 'Checked in' : 'Not yet'}
                </Text>
            </View>

            <Pressable style={s.btn} onPress={() => navigation.navigate('CheckIn')}>
                <Text style={s.btnText}>Check-In</Text>
            </Pressable>
            <Pressable style={[s.btn, s.btnAlt]} onPress={() => navigation.navigate('TodayAppointments')}>
                <Text style={[s.btnText, { color: '#4f46e5' }]}>Today's Appointments</Text>
            </Pressable>
            <Pressable style={[s.btn, s.btnDanger]} onPress={logout}>
                <Text style={s.btnText}>Log out</Text>
            </Pressable>
        </ScrollView>
    );
}

const s = StyleSheet.create({
    wrap: { padding: 20, gap: 12 },
    h: { fontSize: 22, fontWeight: '700', color: '#1a1d29' },
    role: { color: '#6b7280', marginBottom: 8 },
    card: {
        backgroundColor: '#fff', borderRadius: 10, padding: 16,
        borderWidth: 1, borderColor: '#e2e5ee', gap: 4,
    },
    label: { fontSize: 12, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 },
    value: { fontSize: 26, fontWeight: '700', color: '#1a1d29' },
    sub: { fontSize: 12, color: '#6b7280' },
    err: { color: '#dc2626' },
    btn: {
        backgroundColor: '#4f46e5', borderRadius: 8, paddingVertical: 14,
        alignItems: 'center', justifyContent: 'center', minHeight: 48,
    },
    btnAlt: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#c7d2fe' },
    btnDanger: { backgroundColor: '#dc2626' },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});