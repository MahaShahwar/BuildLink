import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('buildlink_token');
    if (token) {
      getMe()
        .then((res) => {
          setUser(res.data.user);
          setProfile(res.data.profile);
        })
        .catch(() => {
          localStorage.removeItem('buildlink_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, userData, profileData) => {
    localStorage.setItem('buildlink_token', token);
    setUser(userData);
    setProfile(profileData);
  };

  const logout = () => {
    localStorage.removeItem('buildlink_token');
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
