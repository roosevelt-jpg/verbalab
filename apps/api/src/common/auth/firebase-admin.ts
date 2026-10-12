import { App, cert, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

let cachedAuth: Auth | null = null;

export function isFirebaseAdminConfigured(): boolean {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return true;
  }
  // Allow project-id-only + application default credentials in some hosts.
  if (process.env.FIREBASE_PROJECT_ID && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return true;
  }
  return false;
}

export function getFirebaseAdminAuth(): Auth {
  if (cachedAuth) return cachedAuth;

  const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID is not set');
  }

  let app: App;
  const existing = getApps()[0];
  if (existing) {
    app = existing;
  } else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    const serviceAccount: ServiceAccount = {
      projectId,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    };
    app = initializeApp({
      credential: cert(serviceAccount),
      projectId,
    });
  } else {
    app = initializeApp({ projectId });
  }

  cachedAuth = getAuth(app);
  return cachedAuth;
}
