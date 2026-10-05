import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile as fbUpdateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  update, 
  push, 
  child,
  onValue, 
  onDisconnect, 
  serverTimestamp, 
  runTransaction,
  query,
  orderByChild,
  equalTo,
  limitToLast
} from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Provided Firebase Configuration
export const firebaseConfig = {
  apiKey: "AIzaSyDtl3sYGvONbf3GwEtYxSblZJMg93tffTk",
  authDomain: "smart-link-6fcaa.firebaseapp.com",
  projectId: "smart-link-6fcaa",
  databaseURL: "https://smart-link-6fcaa-default-rtdb.firebaseio.com",
  storageBucket: "smart-link-6fcaa.firebasestorage.app",
  messagingSenderId: "800004237675",
  appId: "1:800004237675:web:9840db566e5db5cf01c42e",
  measurementId: "G-5YRSRX9ZKP"
};

// Initialize App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Services
export const auth = getAuth(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Analytics (safely check for browser environment)
export let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Ignore analytics error if blocked by adblockers
  });
}

// Database Helper References
export const dbRefs = {
  user: (uid: string) => ref(rtdb, `users/${uid}`),
  users: () => ref(rtdb, 'users'),
  presence: (uid: string) => ref(rtdb, `presence/${uid}`),
  allPresence: () => ref(rtdb, 'presence'),
  connectedRef: () => ref(rtdb, '.info/connected'),
  tasks: () => ref(rtdb, 'tasks'),
  task: (id: string) => ref(rtdb, `tasks/${id}`),
  taskCompletions: () => ref(rtdb, 'taskCompletions'),
  taskCompletion: (id: string) => ref(rtdb, `taskCompletions/${id}`),
  transactions: () => ref(rtdb, 'transactions'),
  transaction: (id: string) => ref(rtdb, `transactions/${id}`),
  withdrawals: () => ref(rtdb, 'withdrawals'),
  withdrawal: (id: string) => ref(rtdb, `withdrawals/${id}`),
  referrals: () => ref(rtdb, 'referrals'),
  referral: (id: string) => ref(rtdb, `referrals/${id}`),
  notifications: () => ref(rtdb, 'notifications'),
  notification: (id: string) => ref(rtdb, `notifications/${id}`),
  loginLogs: () => ref(rtdb, 'loginLogs'),
  activityLogs: () => ref(rtdb, 'activityLogs'),
  settings: () => ref(rtdb, 'settings'),
  levels: () => ref(rtdb, 'levels'),
  paymentMethods: () => ref(rtdb, 'paymentMethods'),
  admins: () => ref(rtdb, 'admins'),
  fraudAlerts: () => ref(rtdb, 'fraudAlerts'),
  verificationCodes: () => ref(rtdb, 'verificationCodes'),
  verificationCode: (uid: string) => ref(rtdb, `verificationCodes/${uid}`)
};
