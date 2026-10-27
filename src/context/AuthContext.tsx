import React, {createContext, useContext, useState, useEffect, useRef, useCallback} from 'react';
import {Alert} from 'react-native';
import i18n from '../i18n';
import {onSessionExpired} from '../services/sessionEvents';
import {isAuthenticated as checkIsAuth, getStoredUser, setStoredUser, getProfile, getStaffProfile, removeFcmToken, removeAuthToken} from '../services/api';
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
  // Re-reads the signed-in user's profile from the server and updates the saved copy (sidebar, headers)
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuth: false,
  userRole: 'staff',
  authChecked: false,
  user: null,
  signIn: () => {},
  signOut: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [isAuth, setIsAuth] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('staff');
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const userRef = useRef<UserInfo | null>(null);
  userRef.current = user;

  // The saved user is a copy made at login, so a profile edit (or one made by someone else) leaves it stale.
  // This fetches the profile again and keeps the changes, in memory and in the keychain.
  const refreshUser = useCallback(async () => {
    const current = userRef.current;
    if (!current) return;
    let changes: Partial<UserInfo> | null = null;
    if (current.role === 'owner') {
      const res = await getProfile();
      const p = res.success ? res.data?.data : undefined;
      if (p) {
        changes = {
          name: p.personalInfo.ownerName,
          email: p.personalInfo.email,
          phoneNumber: p.personalInfo.contactNumber,
          workshopName: p.workshopDetails.workshopName,
        };
      }
    } else {
      const res = await getStaffProfile();
      if (res.success && res.data) {
        changes = {
          name: res.data.name,
          email: res.data.email,
          phoneNumber: res.data.phoneNumber,
          city: res.data.city,
        };
      }
    }
    if (!changes) return;
    const next = {...current, ...changes};
    // Nothing to do (and no re-render) when the saved copy is already right
    if (JSON.stringify(next) === JSON.stringify(current)) return;
    userRef.current = next;
    setUser(next);
    await setStoredUser(next);
  }, []);

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
          // Pick up profile changes made since the last login (not awaited: the app should open at once)
          refreshUser().catch(() => {});
        }
      }
      setIsAuth(auth);
      setAuthChecked(true);
    })();
  }, [refreshUser]);

  // JWT expired / rejected (401): show a popup, then sign out -> login screen
  const sessionAlertShown = useRef(false);
  const isAuthRef = useRef(false);
  isAuthRef.current = isAuth;
  const signOutRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    return onSessionExpired(() => {
      if (!isAuthRef.current || sessionAlertShown.current) return;
      sessionAlertShown.current = true;
      Alert.alert(
        i18n.t('auth.session_expired_title', {defaultValue: 'Session expired'}),
        i18n.t('auth.session_expired_message', {
          defaultValue: 'Your session has expired. Please log in again.',
        }),
        [
          {
            text: i18n.t('auth.login_again', {defaultValue: 'Log in again'}),
            onPress: async () => {
              try {
                await signOutRef.current();
              } finally {
                sessionAlertShown.current = false;
              }
            },
          },
        ],
        {cancelable: false},
      );
    });
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

  signOutRef.current = signOut;

  return (
    <AuthContext.Provider value={{isAuth, userRole, authChecked, user, signIn, signOut, refreshUser}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
