import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB8UkiY8xMBd2H4MJj-BuRP3PaoDwCdk-Y",
  authDomain: "sportixweb.firebaseapp.com",
  projectId: "sportixweb",
  storageBucket: "sportixweb.firebasestorage.app",
  messagingSenderId: "543083927922",
  appId: "1:543083927922:web:71f67cd230b4339bf865eb",
  measurementId: "G-H7CT40F0K1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics is only initialized if supported in the environment (SSR or Browser checks)
export let analytics: any = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
}).catch((err) => {
  console.warn("Firebase Analytics is not supported in this environment:", err);
});

export default app;
