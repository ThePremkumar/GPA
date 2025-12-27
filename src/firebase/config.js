import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Firebase project configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID",
  // Realtime Database URL
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://csbs-c7487-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Validate Firebase config
const validateConfig = () => {
  const required = ['apiKey', 'authDomain', 'projectId', 'databaseURL'];
  const missing = required.filter(key => 
    !firebaseConfig[key] || firebaseConfig[key].includes('YOUR_')
  );
  if (missing.length > 0) {
    console.error('Missing Firebase configuration:', missing.join(', '));
    console.error('Please check your .env file has all required VITE_FIREBASE_* variables');
  }
  return missing.length === 0;
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Realtime Database (primary data storage)
export const rtdb = getDatabase(app);

// Keep db as alias for backwards compatibility
export const db = rtdb;

// Authentication
export const auth = getAuth(app);

// Log config status in development
if (import.meta.env.DEV) {
  validateConfig();
  //console.log('Firebase initialized with project:', firebaseConfig.projectId);
  //console.log('Realtime Database URL:', firebaseConfig.databaseURL);
}

export default app;
