import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, AtSign, Users, UserPlus, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface RegisterProps {
  onNavigate: (path: string) => void;
}

export const Register: React.FC<RegisterProps> = ({ onNavigate }) => {
  const { registerWithEmail, loginWithGoogle } = useAuth();
  const { success, error: toastError } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Extract referral code from URL query (?ref=SMART-XXXXX) if present
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref') || urlParams.get('r');
    if (ref) {
      setReferralCode(ref.toUpperCase());
    } else {
      // Check hash if using hash routing
      const hash = window.location.hash;
      if (hash.includes('ref=')) {
        const hashParams = new URLSearchParams(hash.split('?')[1]);
        const hashRef = hashParams.get('ref');
        if (hashRef) setReferralCode(hashRef.toUpperCase());
      }
    }
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !username.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }

    if (username.length < 3) {
      setErrorMsg('اسم المستخدم يجب أن يكون 3 أحرف على الأقل.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('كلمة المرور يجب أن لا تقل عن 6 أحرف أو أرقام.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('كلمة المرور وتأكيدها غير متطابقين.');
      return;
    }

    if (!agreeTerms) {
      setErrorMsg('يجب الموافقة على شروط الاستخدام وسياسة الحماية.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      await registerWithEmail(
        email.trim(), 
        password, 
        cleanUsername, 
        displayName.trim(), 
        referralCode.trim() || undefined
      );
      success('تم إنشاء حسابك بنجاح! مرحباً بك في SmartEarn.');
      onNavigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      let msg = 'فشل إنشاء الحساب.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'البريد الإلكتروني مستخدم بالفعل بحساب آخر.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'كلمة المرور ضعيفة جداً.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'صيغة البريد الإلكتروني غير صحيحة.';
      }
      setErrorMsg(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setGoogleLoading(true);
      setErrorMsg('');
      await loginWithGoogle(referralCode.trim() || undefined);
      success('تم تسجيل الحساب عبر Google بنجاح!');
      onNavigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        const msg = 'فشل التسجيل باستخدام حساب Google.';
        setErrorMsg(msg);
        toastError(msg);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 selection:bg-emerald-500 selection:text-white relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <button
            onClick={() => onNavigate('/')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>العودة للصفحة الرئيسية</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-white">إنشاء حساب جديد</h1>
          <p className="text-xs text-slate-400">انضم إلى SmartEarn وابدأ في جمع النقاط وسحب الأرباح</p>
        </div>

        {/* Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={googleLoading || loading}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs sm:text-sm font-bold flex items-center justify-center gap-3 transition-all"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{googleLoading ? 'جارِ الاتصال...' : 'التسجيل السريع بواسطة Google'}</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[11px] text-slate-400 font-medium absolute">أو بالبيانات الشخصية</span>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">الاسم الكامل</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="مثال: أحمد محمود"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 pr-10 pl-4 text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">اسم المستخدم (Username)</label>
                <div className="relative">
                  <AtSign className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    dir="ltr"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ahmed99"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 pr-10 pl-4 text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 outline-none transition-colors text-right"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 pr-10 pl-4 text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">كلمة المرور</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 pr-10 pl-4 text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">تأكيد كلمة المرور</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    dir="ltr"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 pr-10 pl-4 text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Referral Code */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>كود الإحالة (اختياري)</span>
                {referralCode && <span className="text-[10px] text-emerald-400 font-bold">تم التعرف على كود الإحالة</span>}
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                <input
                  type="text"
                  dir="ltr"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="SMART-XXXXX"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 pr-10 pl-4 text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 outline-none transition-colors uppercase font-mono text-right"
                />
              </div>
            </div>

            {/* Terms Checkbox */}
            <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-slate-400 pt-1">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-800 text-emerald-600 focus:ring-emerald-500"
              />
              <span>
                أوافق على <span className="text-emerald-400 hover:underline">شروط الخدمة</span>، وأتعهد بعدم استخدام أي VPN أو إنشاء حسابات متعددة.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              <span>{loading ? 'جارِ إنشاء الحساب...' : 'إنشاء الحساب والبدء فوراً'}</span>
            </button>
          </form>

          {/* Login Prompt */}
          <div className="text-center pt-2 border-t border-slate-800">
            <p className="text-xs text-slate-400">
              لديك حساب بالفعل؟{' '}
              <button
                onClick={() => onNavigate('/login')}
                className="font-bold text-emerald-400 hover:underline"
              >
                تسجيل الدخول
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
