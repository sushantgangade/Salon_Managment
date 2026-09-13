import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CheckInScreen from './src/screens/CheckInScreen';
import TodayAppointmentsScreen from './src/screens/TodayAppointmentsScreen';

const Stack = createNativeStackNavigator();

function AdminNoticeScreen() {
  const { user, logout } = useAuth();
  return (
    <View style={s.center}>
      <Text style={s.h}>Hi {user.name}</Text>
      <Text style={s.p}>
        Super Admin accounts manage plans, salons and subscription history from the{' '}
        <Text style={{ fontWeight: '700' }}>web panel</Text>. The mobile app is for salon
        owners and receptionists only.
      </Text>
      <Text style={s.link} onPress={logout}>Log out</Text>
    </View>
  );
}

function RootNavigator() {
  const { user, ready } = useAuth();

  if (!ready) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" />
        <Text style={s.p}>Loading…</Text>
      </View>
    );
  }

  // Key on user id / role so switching accounts fully resets the stack.
  const navKey = user ? `${user.role}:${user.id}` : 'guest';

  return (
    <Stack.Navigator key={navKey}>
      {!user ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : user.role === 'SUPER_ADMIN' ? (
        <Stack.Screen
          name="AdminNotice"
          component={AdminNoticeScreen}
          options={{ title: 'Super Admin' }}
        />
      ) : (
        <>
          <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
          <Stack.Screen name="CheckIn" component={CheckInScreen} options={{ title: 'Check-In' }} />
          <Stack.Screen
            name="TodayAppointments"
            component={TodayAppointmentsScreen}
            options={{ title: "Today's Appointments" }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  h: { fontSize: 22, fontWeight: '700' },
  p: { color: '#555', textAlign: 'center', fontSize: 15, lineHeight: 22 },
  link: { color: '#4f46e5', fontWeight: '700', marginTop: 12 },
});