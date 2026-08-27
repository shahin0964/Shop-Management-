import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore, doc, getDocFromServer, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let isInitialized = false;
let isCloudConnected = false;

// Dynamic check for environment configuration
export function initFirebase() {
  if (isInitialized) {
    return { app, auth, db, isCloudConnected };
  }

  try {
    // Check if firebase config exists in global or vite env
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

    if (apiKey && projectId) {
      const config = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
        projectId: projectId,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      };

      if (!getApps().length) {
        app = initializeApp(config);
      } else {
        app = getApps()[0];
      }

      auth = getAuth(app);
      
      // Initialize Firestore with robust local persistent cache for offline-first reliability
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
      
      isCloudConnected = true;
    }
  } catch (err) {
    console.warn('[Firebase] Running in local/offline client mode until cloud config is provisioned:', err);
    isCloudConnected = false;
  }

  isInitialized = true;
  return { app, auth, db, isCloudConnected };
}

export async function testCloudConnection(): Promise<boolean> {
  const { db } = initFirebase();
  if (!db) return false;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Client is offline or database is provisioning.');
    }
    return false;
  }
}

export { app, auth, db, isCloudConnected };
