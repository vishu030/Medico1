import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockDb, User, Role } from '../utils/mockDb';

interface AuthContextType {
  currentUser: User | null;
  login: (username: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Omit<User, 'isVerified'>) => Promise<User>;
  switchRole: (role: Role) => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if user session is persisted
    const saved = localStorage.getItem('medico_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as User;
        // Fetch fresh copy from mock DB to get latest verification status
        const dbUsers = mockDb.getUsers();
        const fresh = dbUsers.find((u) => u.username === parsed.username);
        if (fresh) {
          setCurrentUser(fresh);
          localStorage.setItem('medico_session', JSON.stringify(fresh));
        } else {
          setCurrentUser(parsed);
        }
      } catch (e) {
        console.error('Error loading session:', e);
      }
    }
  }, []);

  const login = async (username: string): Promise<boolean> => {
    const users = mockDb.getUsers();
    const found = users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (found) {
      setCurrentUser(found);
      localStorage.setItem('medico_session', JSON.stringify(found));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('medico_session');
  };

  const register = async (userData: Omit<User, 'isVerified'>): Promise<User> => {
    const dbUsers = mockDb.getUsers();
    
    // Check if username exists
    const exists = dbUsers.some((u) => u.username.toLowerCase() === userData.username.toLowerCase());
    if (exists) {
      throw new Error('Username already exists');
    }

    const newUser: User = {
      ...userData,
      isVerified: userData.role === 'admin' ? true : false, // Admin is auto-verified, others need approval
    };

    dbUsers.push(newUser);
    mockDb.saveUsers(dbUsers);
    
    // Auto-login registered user
    setCurrentUser(newUser);
    localStorage.setItem('medico_session', JSON.stringify(newUser));
    return newUser;
  };

  // Helper to quickly swap profiles in the prototype
  const switchRole = (role: Role) => {
    const dbUsers = mockDb.getUsers();
    let targetUsername = '';
    
    if (role === 'doctor') {
      targetUsername = 'dr_ananya'; // Verified Doctor
    } else if (role === 'dealer') {
      targetUsername = 'devesh_implants'; // Verified Dealer
    } else if (role === 'admin') {
      targetUsername = 'admin'; // Platform Admin
    }

    const found = dbUsers.find((u) => u.username === targetUsername);
    if (found) {
      setCurrentUser(found);
      localStorage.setItem('medico_session', JSON.stringify(found));
    }
  };

  const refreshUser = () => {
    if (currentUser) {
      const dbUsers = mockDb.getUsers();
      const fresh = dbUsers.find((u) => u.username === currentUser.username);
      if (fresh) {
        setCurrentUser(fresh);
        localStorage.setItem('medico_session', JSON.stringify(fresh));
      }
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, register, switchRole, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
