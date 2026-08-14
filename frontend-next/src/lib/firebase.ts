import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

/**
 * Google sign-in is optional — email and password is the primary flow and
 * needs none of this. With the NEXT_PUBLIC_FIREBASE_* vars unset (a fresh
 * clone, CI, or any deployment that only wants email auth), `getAuth()` throws
 * `auth/invalid-api-key` while the module is still being evaluated. Since both
 * auth forms import GoogleLogin, that throw used to take /login and /register
 * down completely, blocking the email flow over a missing social-provider key.
 *
 * So report the config as absent and let callers degrade, the same way
 * `backend/src/services/ai.js` returns null without ANTHROPIC_API_KEY. Callers
 * must handle a null `auth`; `next build` will not catch a regression here,
 * because both routes are dynamic and never evaluate this module at build time.
 */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId
);

const app = isFirebaseConfigured
  ? getApps()[0] ?? initializeApp(firebaseConfig)
  : null;

export const auth: Auth | null = app ? getAuth(app) : null;
export const googleProvider = new GoogleAuthProvider();
