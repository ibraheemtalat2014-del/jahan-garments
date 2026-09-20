import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase/config';
import { UserProfile } from '../types';
import { GmailService } from '../services/gmailService';

export const GMAIL_SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.labels',
];

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  isCloudOwner: boolean;
  isAuthenticated: boolean;
  googleAccessToken: string | null;
  isGmailConnected: boolean;
  signInWithGoogle: () => Promise<void>;
  connectGmail: () => Promise<string | null>;
  disconnectGmail: () => void;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string, phone?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  loginAsDemoCustomer: () => void;
  loginAsDemoAdmin: () => void;
  isDemoUser: boolean;
}

const OWNER_EMAIL = 'ibraheemtalat2014@gmail.com';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(() => {
    return localStorage.getItem('jg_demo_user') === 'true';
  });

  // Fetch or create user profile in Firestore
  const syncUserProfile = async (user: User) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);

      const isOwnerEmail = user.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        if (isOwnerEmail && data.role !== 'owner') {
          await updateDoc(userRef, { role: 'owner' });
          data.role = 'owner';
        }
        if (isOwnerEmail) {
          try {
            await setDoc(
              doc(db, 'admins', user.uid),
              {
                id: user.uid,
                email: user.email,
                role: 'owner',
                updatedAt: new Date().toISOString(),
              },
              { merge: true }
            );
          } catch (e) {
            console.warn('Admin record sync notice:', e);
          }
        }
        setUserProfile(data);
      } else {
        const newProfile: UserProfile = {
          id: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email?.split('@')[0] || 'Customer',
          phone: user.phoneNumber || '',
          city: 'Lahore',
          area: 'Gulberg',
          address: '',
          role: isOwnerEmail ? 'owner' : 'customer',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userRef, newProfile);
        if (isOwnerEmail) {
          try {
            await setDoc(
              doc(db, 'admins', user.uid),
              {
                id: user.uid,
                email: user.email,
                role: 'owner',
                updatedAt: new Date().toISOString(),
              },
              { merge: true }
            );
          } catch (e) {
            console.warn('Admin record sync notice:', e);
          }
        }
        setUserProfile(newProfile);
      }
    } catch (err) {
      console.warn('Profile sync fallback (offline/permission):', err);
      // Fallback local representation
      setUserProfile({
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Customer',
        city: 'Lahore',
        role: user.email?.toLowerCase() === OWNER_EMAIL.toLowerCase() ? 'owner' : 'customer',
        createdAt: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    // Initial check for stored demo profile if user is not yet loaded
    const savedDemo = localStorage.getItem('jg_demo_profile');
    if (savedDemo && !currentUser) {
      try {
        const parsed = JSON.parse(savedDemo);
        setUserProfile(parsed);
        setIsDemoUser(true);
      } catch (e) {
        console.error(e);
      }
    }

    // Always attach onAuthStateChanged listener to reliably detect Firebase Auth state!
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsDemoUser(false);
        localStorage.removeItem('jg_demo_user');
        localStorage.removeItem('jg_demo_profile');
        await syncUserProfile(user);
      } else {
        const currentSavedDemo = localStorage.getItem('jg_demo_profile');
        if (currentSavedDemo) {
          try {
            setUserProfile(JSON.parse(currentSavedDemo));
            setIsDemoUser(true);
          } catch {
            setUserProfile(null);
            setIsDemoUser(false);
          }
        } else {
          setUserProfile(null);
          setIsDemoUser(false);
          setGoogleAccessToken(null);
          GmailService.setAccessToken(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    GMAIL_SCOPES.forEach((scope) => provider.addScope(scope));
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setGoogleAccessToken(credential.accessToken);
        GmailService.setAccessToken(credential.accessToken);
      }
    } catch (err) {
      console.error('Google Sign In failed:', err);
      throw err;
    }
  };

  const connectGmail = async (): Promise<string | null> => {
    const provider = new GoogleAuthProvider();
    GMAIL_SCOPES.forEach((scope) => provider.addScope(scope));
    provider.setCustomParameters({ prompt: 'consent' });
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setGoogleAccessToken(credential.accessToken);
        GmailService.setAccessToken(credential.accessToken);
        return credential.accessToken;
      }
      return null;
    } catch (err) {
      console.error('Connect Gmail failed:', err);
      throw err;
    }
  };

  const disconnectGmail = () => {
    setGoogleAccessToken(null);
    GmailService.setAccessToken(null);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      console.error('Email login failed:', err);
      throw err;
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string, phone?: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const isOwnerEmail = email.toLowerCase() === OWNER_EMAIL.toLowerCase();
      const profile: UserProfile = {
        id: cred.user.uid,
        email,
        displayName: name,
        phone: phone || '',
        city: 'Lahore',
        area: 'Gulberg',
        address: '',
        role: isOwnerEmail ? 'owner' : 'customer',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', cred.user.uid), profile);
      setUserProfile(profile);
    } catch (err) {
      console.error('Registration failed:', err);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    if (currentUser) {
      await fbSignOut(auth);
    }
    disconnectGmail();
    setIsDemoUser(false);
    setUserProfile(null);
    setCurrentUser(null);
    localStorage.removeItem('jg_demo_user');
    localStorage.removeItem('jg_demo_profile');
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (currentUser) {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, data);
    }
    setUserProfile((prev) => (prev ? { ...prev, ...data } : null));
    if (isDemoUser && userProfile) {
      const updated = { ...userProfile, ...data };
      localStorage.setItem('jg_demo_profile', JSON.stringify(updated));
    }
  };

  // Demo Logins for smooth evaluation without mandatory external phone/OAuth
  const loginAsDemoCustomer = () => {
    const demo: UserProfile = {
      id: 'demo-customer-001',
      email: 'customer.demo@jahangarments.pk',
      displayName: 'Hamza Malik',
      phone: '03001234567',
      city: 'Lahore',
      area: 'DHA Phase 5',
      address: 'House 42, Sector C, DHA Phase 5, Lahore',
      role: 'customer',
      createdAt: new Date().toISOString(),
    };
    setIsDemoUser(true);
    setUserProfile(demo);
    localStorage.setItem('jg_demo_user', 'true');
    localStorage.setItem('jg_demo_profile', JSON.stringify(demo));
  };

  const loginAsDemoAdmin = () => {
    const demoAdmin: UserProfile = {
      id: 'demo-admin-001',
      email: OWNER_EMAIL,
      displayName: 'Ibraheem Talat (Store Owner)',
      phone: '03009876543',
      city: 'Lahore',
      area: 'Gulberg III',
      address: 'Jahan Grments HQ, Main Boulevard, Gulberg III, Lahore',
      role: 'owner',
      createdAt: new Date().toISOString(),
    };
    setIsDemoUser(true);
    setUserProfile(demoAdmin);
    localStorage.setItem('jg_demo_user', 'true');
    localStorage.setItem('jg_demo_profile', JSON.stringify(demoAdmin));
  };

  const isOwner =
    userProfile?.role === 'owner' ||
    currentUser?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();

  const isCloudOwner = currentUser?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();
  const isAdmin = isOwner || userProfile?.role === 'admin';
  const isAuthenticated = !!currentUser || isDemoUser;
  const isGmailConnected = Boolean(googleAccessToken);

  const normalizedProfile = userProfile
    ? { ...userProfile, uid: userProfile.uid || userProfile.id }
    : null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile: normalizedProfile,
        loading,
        isAdmin,
        isOwner,
        isCloudOwner,
        isAuthenticated,
        googleAccessToken,
        isGmailConnected,
        signInWithGoogle,
        connectGmail,
        disconnectGmail,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        logout,
        updateProfileData,
        updateUserProfile: updateProfileData,
        loginAsDemoCustomer,
        loginAsDemoAdmin,
        isDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
