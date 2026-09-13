import { useState } from 'react';
import {
    View, Text, TextInput, Pressable, StyleSheet,
    ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
    const { login } = useAuth();
    const [email, setEmail] = useState('owner@salon.test');
    const [password, setPassword] = useState('owner123');
    const [busy, setBusy] = useState(false);

    async function onSubmit() {
        if (busy) return;
        if (!email || !password) {
            Alert.alert('Missing fields', 'Enter email and password.');
            return;
        }
        setBusy(true);
        try {
            await login(email.trim().toLowerCase(), password);
            // No manual navigation — the navigator key change handles it.
        } catch (e) {
            const msg = e?.data?.message || e?.message || 'Login failed';
            Alert.alert('Login failed', msg);
        } finally {
            setBusy(false);
        }
    }

    return (
        <KeyboardAvoidingView
            style={s.wrap}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <Text style={s.h}>Salon CRM</Text>
            <Text style={s.sub}>Sign in to continue</Text>

            <TextInput
                style={s.input}
                placeholder="Email"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                style={s.input}
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            <Pressable style={[s.btn, busy && s.btnDisabled]} onPress={onSubmit} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Sign in</Text>}
            </Pressable>

            {/* <View style={s.hint}>
                <Text style={s.hintTitle}>Demo logins</Text>
                <Text style={s.hintLine}>Owner: owner@salon.test / owner123</Text>
                <Text style={s.hintLine}>Receptionist: reception@salon.test / recep123</Text>
                <Text style={s.hintLine}>(Super Admin uses the web panel)</Text>
            </View> */}
        </KeyboardAvoidingView>
    );
}

const s = StyleSheet.create({
    wrap: { flex: 1, padding: 24, justifyContent: 'center', gap: 12, backgroundColor: '#f6f7fb' },
    h: { fontSize: 26, fontWeight: '700', textAlign: 'center', color: '#1a1d29' },
    sub: { textAlign: 'center', color: '#6b7280', marginBottom: 16 },
    input: {
        borderWidth: 1, borderColor: '#e2e5ee', borderRadius: 8,
        paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fff', fontSize: 15,
    },
    btn: {
        backgroundColor: '#4f46e5', borderRadius: 8, paddingVertical: 14,
        alignItems: 'center', justifyContent: 'center', marginTop: 6, minHeight: 48,
    },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    hint: { marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e2e5ee' },
    hintTitle: { fontWeight: '700', color: '#1a1d29', marginBottom: 6 },
    hintLine: { color: '#6b7280', fontSize: 13, lineHeight: 20 },
});