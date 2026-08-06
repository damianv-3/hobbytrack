import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children })
{
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  useEffect(() =>
  {
    if (token)
    {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser({ userId: payload.userId, username: payload.username });
    }
    else
    {
      setUser(null);
    }
  }, [token]);

  const login = (newToken) =>
  {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () =>
  {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth()
{
  return useContext(AuthContext);
}