import { createContext, useContext, useEffect, useState } from 'react';
import { api, AsyncStorage } from '../api';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (token) {
                    const me = await api.me();
                    setUser(me);
                }
            } catch {
                await AsyncStorage.removeItem('token');
                setUser(null);
            } finally {
                setReady(true);
            }
        })();
    }, []);

    async function login(email, password) {
        const data = await api.login(email, password);   // { token, user }
        await AsyncStorage.setItem('token', data.token);  // persist FIRST
        setUser(data.user);                               // then flip state → triggers nav key change
        return data.user;
    }

    async function logout() {
        await AsyncStorage.removeItem('token');
        setUser(null);                                    // key flips to 'guest' → Login mounts
    }

    return (
        <Ctx.Provider value={{ user, ready, login, logout }}>
            {children}
        </Ctx.Provider>
    );
}

export const useAuth = () => useContext(Ctx);