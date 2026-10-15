import { createContext, useContext, useEffect, useState } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('mobix_token')));

  //all
  const [branchId, setBranchIdState] = useState(
    () => localStorage.getItem('mobix_branch') || 'all'
  );

  const setBranchId = (id) => {
    localStorage.setItem('mobix_branch', String(id));
    setBranchIdState(String(id));
  };
  useEffect(() => {
    if (!localStorage.getItem('mobix_token')) return;

    client
      .get('/me')
      .then((res) => setMe(res.data))
      .catch(() => localStorage.removeItem('mobix_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (token) => {
    localStorage.setItem('mobix_token', token);
    setLoading(true);
    try {
      const res = await client.get('/me');
      setMe(res.data);
    } catch {
      localStorage.removeItem('mobix_token');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await client.post('/auth/logout');
    } finally {
      localStorage.removeItem('mobix_token');
      setMe(null);
    }
  };

  // can('settings', 'edit') -> true / false
  const can = (module, action = 'view') => Boolean(me?.permissions?.[module]?.[action]);

  return (
    <AuthContext.Provider value={{ me, loading, login, logout, can, branchId, setBranchId }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}