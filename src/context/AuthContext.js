import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, clientsAPI, tokenStore, setUnauthorizedHandler } from '../api/client';
import { registerForPush, unregisterPush, scheduleAppointmentReminders } from '../notifications/setup';

const AuthContext = createContext(null);

async function afterAuth() {
  try {
    await registerForPush();
    const res = await clientsAPI.upcomingAppointments();
    await scheduleAppointmentReminders(res.data || []);
  } catch (e) {
    console.error('afterAuth error', e);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    (async () => {
      const token = await tokenStore.get();
      if (!token) { setLoading(false); return; }
      try {
        const res = await authAPI.me();
        setUser(res.data);
        afterAuth();
      } catch {
        await tokenStore.clear();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    await tokenStore.set(res.data.token);
    const me = await authAPI.me();
    setUser(me.data);
    afterAuth();
    return me.data;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    await tokenStore.set(res.data.token);
    const me = await authAPI.me();
    setUser(me.data);
    afterAuth();
    return me.data;
  };

  const logout = async () => {
    await unregisterPush();
    await tokenStore.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
