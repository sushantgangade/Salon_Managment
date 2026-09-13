import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { api } from '../api';

export default function TodayAppointmentsScreen() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.todayAppointments()
            .then(setRows)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <View style={s.wrap}><ActivityIndicator size="large" /></View>;

    return (
        <View style={s.wrap}>
            <FlatList
                data={rows}
                keyExtractor={(item) => item._id}
                ListEmptyComponent={<Text>No appointments today.</Text>}
                renderItem={({ item }) => (
                    <View style={s.row}>
                        <Text style={s.time}>{item.startTime}–{item.endTime}</Text>
                        <Text style={s.client}>{item.clientId?.name} — {item.serviceId?.name}</Text>
                        <Text style={s.status}>{item.status}</Text>
                    </View>
                )}
            />
        </View>
    );
}

const s = StyleSheet.create({
    wrap: { flex: 1, padding: 16 },
    row: { paddingVertical: 10, borderBottomWidth: 1, borderColor: '#eee' },
    time: { fontWeight: '700' },
    client: { fontSize: 14, color: '#333' },
    status: { fontSize: 12, color: '#888' },
});