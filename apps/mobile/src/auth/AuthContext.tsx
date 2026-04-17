import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FbUser,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { config, isFirebaseConfigured } from '@/lib/config';

type Mode = 'firebase' | 'dev';

type AuthValue = {
  mode: Mode;
  uid: string | null;
  email: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInDev: (uid: string) => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
};

const DEV_UID_KEY = '@aireaigame/devUid';

const AuthCtx = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const firebaseAuth = getFirebaseAuth();
  const mode: Mode = firebaseAuth ? 'firebase' : 'dev';
  const [uid, setUid] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [fbUser, setFbUser] = useState<FbUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    if (firebaseAuth) {
      unsub = onAuthStateChanged(firebaseAuth, (user) => {
        setFbUser(user);
        setUid(user?.uid ?? null);
        setEmail(user?.email ?? null);
        setLoading(false);
      });
    } else {
      AsyncStorage.getItem(DEV_UID_KEY).then((saved) => {
        setUid(saved);
        setLoading(false);
      });
    }
    return () => unsub?.();
  }, [firebaseAuth]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!firebaseAuth) throw new Error('Firebase not configured');
      await signInWithEmailAndPassword(firebaseAuth, email, password);
    },
    [firebaseAuth],
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      if (!firebaseAuth) throw new Error('Firebase not configured');
      await createUserWithEmailAndPassword(firebaseAuth, email, password);
    },
    [firebaseAuth],
  );

  const signInDev = useCallback(async (devUid: string) => {
    await AsyncStorage.setItem(DEV_UID_KEY, devUid);
    setUid(devUid);
  }, []);

  const signOut = useCallback(async () => {
    if (firebaseAuth) {
      await firebaseSignOut(firebaseAuth);
    } else {
      await AsyncStorage.removeItem(DEV_UID_KEY);
      setUid(null);
    }
  }, [firebaseAuth]);

  const getIdToken = useCallback(async (): Promise<string | null> => {
    if (firebaseAuth && fbUser) return fbUser.getIdToken();
    if (!firebaseAuth && uid) return `dev:${uid}`;
    return null;
  }, [firebaseAuth, fbUser, uid]);

  const value: AuthValue = useMemo(
    () => ({ mode, uid, email, loading, signIn, signUp, signInDev, signOut, getIdToken }),
    [mode, uid, email, loading, signIn, signUp, signInDev, signOut, getIdToken],
  );

  if (!isFirebaseConfigured && !config.devBypass) {
    console.warn('Firebase is not configured and devBypass is off; auth will always fail.');
  }

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
