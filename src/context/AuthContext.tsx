import {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import {LocationID} from '@/lib/api';

interface User {
  id: string;
  username: string;
  roleName: string;
  role: 'super_admin' | 'branch_admin';
  location_id: LocationID;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: {children: ReactNode}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('autocashier_user');
    const authStatus = localStorage.getItem('isAuthenticated');
    
    if (savedUser && authStatus === 'true') {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (e) {
        localStorage.removeItem('autocashier_user');
        localStorage.removeItem('isAuthenticated');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('autocashier_user', JSON.stringify(userData));
    localStorage.setItem('isAuthenticated', 'true');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('autocashier_user');
    localStorage.setItem('isAuthenticated', 'false');
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0F172A]">
        <div className="h-12 w-12 animate-spin rounded-2xl border-4 border-indigo-600 border-t-transparent shadow-xl shadow-indigo-500/20"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      user, 
      login, 
      logout, 
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
