import React, {createContext, useContext, useState, useEffect} from 'react';
import {isAuthenticated as checkIsAuth, getStoredUser, removeFcmToken, removeAuthToken} from '../services/api';
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
      console.log('[NOTIF] AuthContext — checking stored auth');
      const auth = await checkIsAuth();
      console.log('[NOTIF] AuthContext — isAuthenticated:', auth);
      if (auth) {
        const storedUser = await getStoredUser();
        if (storedUser) {
          console.log(`[NOTIF] AuthContext — restoring session for userId:${storedUser.id} role:${storedUser.role}`);
          setUser(storedUser);
          setUserRole(storedUser.role);
          console.log('[NOTIF] AuthContext — calling registerFCMToken on session restore');
          const ok = await registerFCMToken();
          console.log(`[NOTIF] AuthContext — registerFCMToken result: ${ok}`);
        }
      }
      setIsAuth(auth);
      setAuthChecked(true);
    })();
  }, []);

  // Listen for FCM token refresh
  useEffect(() => {
    if (isAuth) {
      console.log('[NOTIF] AuthContext — registering onTokenRefresh listener');
      const unsubscribe = onTokenRefresh(async (newToken) => {
        console.log(`[NOTIF] AuthContext — token refreshed, re-registering: ${newToken?.slice(0, 20)}...`);
        const ok = await registerFCMToken();
        console.log(`[NOTIF] AuthContext — re-register result: ${ok}`);
      });

      return () => {
        console.log('[NOTIF] AuthContext — removing onTokenRefresh listener');
        unsubscribe();
      };
    }
  }, [isAuth]);

  const signIn = async (loggedInUser: UserInfo) => {
    console.log(`[NOTIF] AuthContext — signIn for userId:${loggedInUser.id} role:${loggedInUser.role}`);
    setIsAuth(true);
    setUser(loggedInUser);
    setUserRole(loggedInUser.role);
    console.log('[NOTIF] AuthContext — calling registerFCMToken after login');
    const ok = await registerFCMToken();
    console.log(`[NOTIF] AuthContext — registerFCMToken result: ${ok}`);
  };

  const signOut = async () => {
    console.log('[NOTIF] AuthContext — signOut, unregistering FCM token');
    await unregisterFCMToken();
    await removeFcmToken();
    await removeAuthToken();
    setIsAuth(false);
    setUser(null);
    setUserRole('staff');
    console.log('[NOTIF] AuthContext — signOut complete');
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
