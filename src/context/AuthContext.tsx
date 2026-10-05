import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile as fbUpdateProfile
} from 'firebase/auth';
import { 
  ref, 
  get, 
  set, 
  update, 
  onValue, 
  onDisconnect, 
  serverTimestamp,
  runTransaction
} from 'firebase/database';
import { auth, rtdb, googleProvider, dbRefs } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';
import { recordLoginLog, logActivity, sendNotification, initializeDatabaseDefaults } from '../lib/dbService';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isOnline: boolean;
  is2FAVerified: boolean;
  activeOtpCode: string | null;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, username: string, displayName: string, refCode?: string) => Promise<void>;
  loginWithGoogle: (refCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendLoginOtpCode: () => Promise<string>;
  verifyLoginOtp: (code: string) => Promise<{ success: boolean; message: string }>;
  checkEmailVerificationStatus: () => Promise<{ verified: boolean; message: string }>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const ADMIN_EMAILS = [
  'cybenode.site@gmail.com',
  'support.cybenode.site@gmail.com',
  '7oud3.dev@gmail.com'
];
function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'SMART-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Device info detection for security logs
function getClientDetails() {
  const ua = navigator.userAgent;
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  let device = 'Desktop';

  if (/android/i.test(ua)) {
    device = 'Android Phone';
    os = 'Android';
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    device = 'iOS Device';
    os = 'iOS';
  } else if (/windows/i.test(ua)) {
    os = 'Windows';
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = 'macOS';
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
  }

  if (/chrome|crios/i.test(ua) && !/edge|edg/i.test(ua)) {
    browser = 'Google Chrome';
  } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
    browser = 'Apple Safari';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Mozilla Firefox';
  } else if (/edge|edg/i.test(ua)) {
    browser = 'Microsoft Edge';
  }

  return { browser, os, device, userAgent: ua, ip: '127.0.0.1 (Web Session)' };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [is2FAVerified, setIs2FAVerified] = useState(false);
  const [activeOtpCode, setActiveOtpCode] = useState<string | null>(null);

  // Send or regenerate 6-digit Login OTP verification code
  const sendLoginOtpCode = async (): Promise<string> => {
    const user = auth.currentUser;
    if (!user) throw new Error('لا يوجد مستخدم مسجل حالياً.');
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const client = getClientDetails();

    const otpData = {
      id: user.uid,
      uid: user.uid,
      email: user.email || '',
      code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      createdAt: Date.now(),
      verified: false,
      ...client
    };

    await set(dbRefs.verificationCode(user.uid), otpData);
    setActiveOtpCode(code);

    // Send notification
    await sendNotification(
      user.uid,
      '🔐 كود التحقق من تسجيل الدخول (2FA)',
      `كود التحقق الخاص بك لتسجيل الدخول هو: [ ${code} ] - لا تشارك هذا الرمز مع أي شخص.`,
      'security'
    );

    return code;
  };

  // Verify entered OTP
  const verifyLoginOtp = async (inputCode: string): Promise<{ success: boolean; message: string }> => {
    if (!auth.currentUser) return { success: false, message: 'انتهت الجلسة. يرجى تسجيل الدخول مجدداً.' };
    const user = auth.currentUser;

    const snap = await get(dbRefs.verificationCode(user.uid));
    if (!snap.exists()) {
      return { success: false, message: 'لم يتم العثور على رمز تحقق نشط. يرجى طلب رمز جديد.' };
    }

    const data = snap.val();
    if (Date.now() > data.expiresAt) {
      return { success: false, message: 'انتهت صلاحية رمز التحقق. يرجى طلب كود جديد.' };
    }

    if (data.code !== inputCode.trim()) {
      return { success: false, message: 'رمز التحقق غير صحيح. يرجى التأكد وإعادة المحاولة.' };
    }

    // Mark verified in DB and state
    await update(dbRefs.verificationCode(user.uid), { verified: true, verifiedAt: Date.now() });
    setIs2FAVerified(true);

    return { success: true, message: 'تم التحقق من جهازك بنجاح! مرحباً بك في المنصة.' };
  };

  // Check if Firebase Auth email verification link was clicked via SMTP
  const checkEmailVerificationStatus = async (): Promise<{ verified: boolean; message: string }> => {
    if (!auth.currentUser) return { verified: false, message: 'لا يوجد مستخدم مسجل حالياً.' };
    try {
      await auth.currentUser.reload();
      const refreshedUser = auth.currentUser;
      if (refreshedUser && refreshedUser.emailVerified) {
        setIs2FAVerified(true);
        const userRef = dbRefs.user(refreshedUser.uid);
        await update(userRef, { emailVerified: true, lastActiveAt: Date.now() });
        return { verified: true, message: 'تم تأكيد بريدك الإلكتروني بنجاح عبر خادم SMTP! مرحباً بك.' };
      }
      return { verified: false, message: 'البريد الإلكتروني لم يتم توثيقه بعد. يرجى فتح الرسالة والضغط على رابط التفعيل.' };
    } catch (err: any) {
      return { verified: false, message: 'تعذر التحقق من حالة البريد الإلكتروني.' };
    }
  };

  // Initialize RTDB defaults once on load
  useEffect(() => {
    initializeDatabaseDefaults();
  }, []);

  // Sync Auth State and Profile
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Listen to RTDB user document in real-time
        const userRef = dbRefs.user(user.uid);
        const unsubProfile = onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const data: UserProfile = snapshot.val();
            setUserProfile(data);
          } else {
            // Profile doesn't exist yet, create initial profile
            createInitialUserProfile(user);
          }
          setLoading(false);
        });

        // Setup Presence System
        setupPresence(user);

        return () => {
          unsubProfile();
        };
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // Setup Realtime Presence
  const setupPresence = (user: FirebaseUser) => {
    const connectedRef = dbRefs.connectedRef();
    const presenceRef = dbRefs.presence(user.uid);
    const client = getClientDetails();

    onValue(connectedRef, (snap) => {
      if (snap.val() === false) {
        setIsOnline(false);
        return;
      }

      setIsOnline(true);
      onDisconnect(presenceRef)
        .set({
          uid: user.uid,
          state: 'offline',
          lastChanged: serverTimestamp(),
          lastSeen: Date.now(),
          displayName: user.displayName || user.email?.split('@')[0],
          email: user.email,
          ...client
        })
        .then(() => {
          set(presenceRef, {
            uid: user.uid,
            state: 'online',
            lastChanged: serverTimestamp(),
            lastSeen: Date.now(),
            currentSession: Date.now().toString(),
            displayName: user.displayName || user.email?.split('@')[0],
            email: user.email,
            ...client
          });
        });
    });
  };

  // Helper to create profile on first login / registration
  const createInitialUserProfile = async (user: FirebaseUser, customUsername?: string, refCodeInput?: string) => {
    const userRef = dbRefs.user(user.uid);
    const snap = await get(userRef);
    if (snap.exists()) return snap.val();

    let validReferredBy: string | null = null;

    // Check if referral code is valid and not self
    if (refCodeInput && refCodeInput.trim()) {
      const cleanRef = refCodeInput.trim().toUpperCase();
      const usersSnap = await get(dbRefs.users());
      if (usersSnap.exists()) {
        const allUsers: Record<string, UserProfile> = usersSnap.val();
        const referrer = Object.values(allUsers).find((u) => u.referralCode === cleanRef && u.uid !== user.uid);
        if (referrer) {
          validReferredBy = cleanRef;
          // Increment referrer's successfulReferrals count
          const referrerRef = dbRefs.user(referrer.uid);
          await runTransaction(referrerRef, (curr: UserProfile | null) => {
            if (!curr) return curr;
            return {
              ...curr,
              successfulReferrals: (curr.successfulReferrals || 0) + 1
            };
          });

          // Send notification to referrer
          await sendNotification(
            referrer.uid,
            '🤝 مستخدم جديد سجل عبر رابطك!',
            `قام صديق بالتسجيل باستخدام كود الإحالة الخاص بك (${cleanRef}). ستحصل على عمولة من جميع مهامه!`,
            'referral'
          );
        }
      }
    }

    const client = getClientDetails();
    const newReferralCode = generateReferralCode();
    const username = customUsername || user.email?.split('@')[0] || `user_${user.uid.substring(0, 5)}`;
    const displayName = user.displayName || username;

    // Check if user is an authorized admin
    const userEmailLower = (user.email || '').toLowerCase();
    const isAuthorizedAdmin = ADMIN_EMAILS.includes(userEmailLower);
    const role: UserRole = isAuthorizedAdmin ? 'superadmin' : 'user';

    const newProfile: UserProfile = {
      uid: user.uid,
      username,
      displayName,
      email: user.email || '',
      photoURL: user.photoURL || '',
      referralCode: newReferralCode,
      referredBy: validReferredBy,
      balance: 0,
      points: 0,
      totalEarned: 0,
      totalWithdrawn: 0,
      referralEarnings: 0,
      level: 'Bronze',
      completedTasks: 0,
      successfulReferrals: 0,
      accountStatus: 'active',
      role,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      lastActiveAt: Date.now(),
      ...client
    };

    await set(userRef, newProfile);
    setUserProfile(newProfile);

    // Send welcome notification
    await sendNotification(
      user.uid,
      '👋 أهلاً بك في SmartEarn!',
      'ابدأ بتنفيذ المهام اليومية، ارتقِ بمستواك، واجمع النقاط لتحويلها إلى أموال حقيقية.',
      'system'
    );

    // Log Activity
    await logActivity({
      actorId: user.uid,
      actorEmail: user.email || '',
      action: 'User Registered',
      description: `تم تسجيل حساب جديد بنجاح (${username})`,
      metadata: { referralCode: newReferralCode, referredBy: validReferredBy }
    });

    return newProfile;
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const client = getClientDetails();
      
      // Update lastLoginAt
      const userRef = dbRefs.user(cred.user.uid);
      await update(userRef, {
        lastLoginAt: Date.now(),
        lastActiveAt: Date.now()
      });

      // Record Login Log
      await recordLoginLog({
        userId: cred.user.uid,
        email: cred.user.email || email,
        status: 'Successful Login',
        ...client
      });

      await logActivity({
        actorId: cred.user.uid,
        actorEmail: email,
        action: 'Login',
        description: 'تسجيل دخول ناجح بالبريد وكلمة المرور'
      });
    } catch (err: any) {
      const client = getClientDetails();
      await recordLoginLog({
        userId: 'anonymous',
        email,
        status: 'Failed Login',
        ...client
      });
      throw err;
    }
  };

  const registerWithEmail = async (
    email: string, 
    pass: string, 
    username: string, 
    displayName: string, 
    refCode?: string
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await fbUpdateProfile(cred.user, { displayName });
    await createInitialUserProfile(cred.user, username, refCode);
    const client = getClientDetails();
    
    await recordLoginLog({
      userId: cred.user.uid,
      email,
      status: 'Successful Login',
      ...client
    });
  };

  const loginWithGoogle = async (refCode?: string) => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const userRef = dbRefs.user(cred.user.uid);
      const snap = await get(userRef);

      if (!snap.exists()) {
        await createInitialUserProfile(cred.user, undefined, refCode);
      } else {
        await update(userRef, {
          lastLoginAt: Date.now(),
          lastActiveAt: Date.now()
        });
      }

      const client = getClientDetails();
      await recordLoginLog({
        userId: cred.user.uid,
        email: cred.user.email || '',
        status: 'Successful Login',
        ...client
      });

      await logActivity({
        actorId: cred.user.uid,
        actorEmail: cred.user.email || '',
        action: 'Login Google',
        description: 'تسجيل دخول ناجح عبر حساب Google'
      });
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      throw err;
    }
  };

  const logout = async () => {
    if (currentUser) {
      const client = getClientDetails();
      await recordLoginLog({
        userId: currentUser.uid,
        email: currentUser.email || '',
        status: 'Logout',
        ...client
      });
      const presenceRef = dbRefs.presence(currentUser.uid);
      await set(presenceRef, {
        uid: currentUser.uid,
        state: 'offline',
        lastChanged: serverTimestamp(),
        lastSeen: Date.now(),
        ...client
      });
    }
    setIs2FAVerified(false);
    setActiveOtpCode(null);
    await signOut(auth);
    setUserProfile(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
    const client = getClientDetails();
    await recordLoginLog({
      userId: 'requested',
      email,
      status: 'Password Reset',
      ...client
    });
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const userRef = dbRefs.user(currentUser.uid);
    // Disallow editing sensitive financial fields directly
    const { balance, points, totalEarned, totalWithdrawn, referralEarnings, level, role, accountStatus, ...allowedData } = data as any;
    await update(userRef, allowedData);
    if (allowedData.displayName) {
      await fbUpdateProfile(currentUser, { displayName: allowedData.displayName });
    }
  };

  const refreshProfile = async () => {
    if (!currentUser) return;
    const userRef = dbRefs.user(currentUser.uid);
    const snap = await get(userRef);
    if (snap.exists()) {
      setUserProfile(snap.val());
    }
  };

  const userEmailLower = (currentUser?.email || userProfile?.email || '').toLowerCase();
  const isAdmin = (userProfile?.role === 'admin' || userProfile?.role === 'superadmin') || ADMIN_EMAILS.includes(userEmailLower);
  const isSuperAdmin = userProfile?.role === 'superadmin' || ADMIN_EMAILS.includes(userEmailLower);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAdmin,
        isSuperAdmin,
        isOnline,
        is2FAVerified,
        activeOtpCode,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        resetPassword,
        sendLoginOtpCode,
        verifyLoginOtp,
        checkEmailVerificationStatus,
        updateProfileData,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
