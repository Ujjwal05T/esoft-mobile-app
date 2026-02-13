import React, {createContext, useContext, useState, useEffect} from 'react';
import {isAuthenticated as checkIsAuth, getStoredUser} from '../services/api';
import type {UserInfo} from '../services/api';
import type {UserRole} from '../components';

interface AuthContextType {
  isAuth: boolean;
  userRole: UserRole;
  authChecked: boolean;
  user: UserInfo | null;
  signIn: (user: UserInfo) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuth: false,
  userRole: 'staff',
  authChecked: false,
  user: null,
  signIn: () => {},
  signOut: () => {},
});

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [isAuth, setIsAuth] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('staff');
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    (async () => {
      const auth = await checkIsAuth();
      if (auth) {
        const storedUser = await getStoredUser();
        if (storedUser) {
          setUser(storedUser);
          setUserRole(storedUser.role);
        }
      }
      setIsAuth(auth);
      setAuthChecked(true);
    })();
  }, []);

  const signIn = (loggedInUser: UserInfo) => {
    setIsAuth(true);
    setUser(loggedInUser);
    setUserRole(loggedInUser.role);
  };

  const signOut = () => {
    setIsAuth(false);
    setUser(null);
    setUserRole('staff');
  };

  return (
    <AuthContext.Provider value={{isAuth, userRole, authChecked, user, signIn, signOut}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
