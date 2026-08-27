import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Firestore,
} from 'firebase/firestore';
import { AppSettings } from '../types';

/**
 * Firebase Client Configuration.
 * Loads securely from Vite environment variables (VITE_FIREBASE_API_KEY, etc.)
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Check if Firebase credentials are provided
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey.length > 5
);

// Designated Station Owner Email (Configured via env or default)
export const AUTHORIZED_OWNER_EMAIL = (
  import.meta.env.VITE_OWNER_EMAIL || 'jaisolanki195@gmail.com'
).toLowerCase().trim();

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.warn('Firebase initialization warning:', err);
  }
}

/**
 * Checks if a user is the verified authorized station owner.
 */
export function isUserAuthorizedOwner(user: User | null): boolean {
  if (!user || !user.email) return false;
  return user.email.toLowerCase().trim() === AUTHORIZED_OWNER_EMAIL;
}

/**
 * Initiates Google OAuth Sign-In for Station Owner.
 */
export async function signInOwnerWithGoogle(): Promise<{
  success: boolean;
  user: User | null;
  isOwner: boolean;
  error?: string;
}> {
  if (!isFirebaseConfigured || !auth) {
    return {
      success: false,
      user: null,
      isOwner: false,
      error: 'Firebase is not yet configured with your project credentials. Please add VITE_FIREBASE_API_KEY in your environment.',
    };
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const isOwner = isUserAuthorizedOwner(user);

    if (!isOwner) {
      // If someone else signed in with another Google account, sign them out immediately
      await signOut(auth);
      return {
        success: false,
        user: null,
        isOwner: false,
        error: `Access Denied: Account ${user.email} is not authorized to manage Father's Radio. Only ${AUTHORIZED_OWNER_EMAIL} is permitted.`,
      };
    }

    return {
      success: true,
      user,
      isOwner: true,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication failed';
    return {
      success: false,
      user: null,
      isOwner: false,
      error: message,
    };
  }
}

/**
 * Sign out current owner session.
 */
export async function signOutOwner(): Promise<void> {
  if (auth) {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Error signing out:', e);
    }
  }
}

/**
 * Listen to Auth state changes.
 */
export function subscribeToOwnerAuth(
  callback: (user: User | null, isOwner: boolean) => void
): () => void {
  if (!auth) {
    callback(null, false);
    return () => {};
  }

  return onAuthStateChanged(auth, (user) => {
    const isOwner = isUserAuthorizedOwner(user);
    callback(user, isOwner);
  });
}

/**
 * Firestore Canonical Station Configuration Document Reference
 */
const STATION_DOC_PATH = 'station_config/fathers_radio_canonical';

/**
 * Subscribe to global canonical owner configuration in Cloud Firestore.
 * Automatically broadcasts updates to all active listeners in real time.
 */
export function subscribeToGlobalStationConfig(
  onUpdate: (config: Partial<AppSettings>) => void,
  onError?: (err: Error) => void
): () => void {
  if (!db) {
    return () => {};
  }

  try {
    const docRef = doc(db, 'station_config', 'fathers_radio_canonical');
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && typeof data === 'object') {
            onUpdate(data as Partial<AppSettings>);
          }
        }
      },
      (err) => {
        console.warn('Firestore global config listener warning:', err);
        if (onError) onError(err);
      }
    );
  } catch (err) {
    console.warn('Failed to attach Firestore listener:', err);
    return () => {};
  }
}

/**
 * Save canonical owner configuration to Cloud Firestore.
 * This updates the global station state for every visitor worldwide.
 */
export async function saveGlobalStationConfig(
  settings: AppSettings,
  currentUser: User | null
): Promise<{ success: boolean; error?: string }> {
  if (!isUserAuthorizedOwner(currentUser)) {
    return {
      success: false,
      error: 'Unauthorized: Only verified station owner can update global settings.',
    };
  }

  if (!db) {
    return {
      success: false,
      error: 'Cloud database is not connected. Settings were saved to your local browser only.',
    };
  }

  try {
    const docRef = doc(db, 'station_config', 'fathers_radio_canonical');
    const payload = {
      appearance: settings.appearance,
      atmosphere: settings.atmosphere,
      content: settings.content,
      heroImage: {
        isDefault: settings.heroImage.isDefault,
        customImageUrl: settings.heroImage.customImageUrl,
      },
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.email || 'owner',
    };

    await setDoc(docRef, payload, { merge: true });
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save to cloud';
    return { success: false, error: message };
  }
}
