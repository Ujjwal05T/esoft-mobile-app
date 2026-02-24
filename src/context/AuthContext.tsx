import React, {createContext, useContext, useState, useEffect} from 'react';
import {isAuthenticated as checkIsAuth, getStoredUser, removeFcmToken} from '../services/api';
import type {UserInfo} from '../services/api';
import type {UserRole} from '../components';
import {registerFCMToken, unregisterFCMToken, onTokenRefresh} from '../services/notificationService';

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
          // Register FCM token for authenticated user
          await registerFCMToken();
        }
      }
      setIsAuth(auth);
      setAuthChecked(true);
    })();
  }, []);

  // Listen for FCM token refresh
  useEffect(() => {
    if (isAuth) {
      const unsubscribe = onTokenRefresh(async (newToken) => {
        console.log('FCM Token refreshed:', newToken);
        // Re-register the new token with backend
        await registerFCMToken();
      });

      return () => {
        unsubscribe();
      };
    }
  }, [isAuth]);

  const signIn = async (loggedInUser: UserInfo) => {
    setIsAuth(true);
    setUser(loggedInUser);
    setUserRole(loggedInUser.role);
    // Register FCM token after successful login
    await registerFCMToken();
  };

  const signOut = async () => {
    // Unregister FCM token before logging out
    await unregisterFCMToken();
    await removeFcmToken();
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
