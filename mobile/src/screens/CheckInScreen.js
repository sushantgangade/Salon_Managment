import { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { api } from '../api';

export default function CheckInScreen() {
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState('');

    async function onCheckIn() {
        setBusy(true); setMsg('');
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                throw new Error('Location permission denied. Please enable GPS to check in.');
            }

            const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            const { latitude, longitude } = pos.coords;

            const res = await api.checkIn(latitude, longitude);
            setMsg(`✅ Checked in (${res.distanceMeters}m from salon)`);
        } catch (e) {
            // Show backend's structured error when available
            setMsg(`❌ ${e.message}`);
        } finally {
            setBusy(false);
        }
    }

    return (
        <View style={s.wrap}>
            <Text style={s.h}>Check-In</Text>
            <Text style={s.sub}>Your location is captured on-device and verified server-side.</Text>
            {busy ? <ActivityIndicator size="large" /> : <Button title="Check In Now" onPress={onCheckIn} />}
            {msg ? <Text style={s.msg}>{msg}</Text> : null}
        </View>
    );
}

const s = StyleSheet.create({
    wrap: { flex: 1, padding: 20, gap: 12 },
    h: { fontSize: 22, fontWeight: '700' },
    sub: { color: '#666' },
    msg: { marginTop: 12, fontSize: 16 },
});