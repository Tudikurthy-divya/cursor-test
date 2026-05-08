import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const TOKEN_KEY = 'my_crud_app_token';

function createApi() {
  const instance = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
  });
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  return instance;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const api = useMemo(() => createApi(), []);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [api]);

  const persistSession = useCallback((token, nextUser) => {
    localStorage.setItem(TOKEN_KEY, token);
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post('/auth/login', { email, password });
      persistSession(data.token, data.user);
      return data;
    },
    [api, persistSession]
  );

  const signup = useCallback(
    async (firstName, lastName, email, password) => {
      const { data } = await api.post('/auth/signup', {
        firstName,
        lastName,
        email,
        password,
      });
      persistSession(data.token, data.user);
      return data;
    },
    [api, persistSession]
  );

  const googleLogin = useCallback(
    async (accessToken) => {
      const { data } = await api.post('/auth/google', {
        credential: accessToken,
      });
      persistSession(data.token, data.user);
      return data;
    },
    [api, persistSession]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      signup,
      googleLogin,
      logout,
      api,
    }),
    [user, loading, login, signup, googleLogin, logout, api]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
