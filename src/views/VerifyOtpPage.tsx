import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  ArrowLeft, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Smartphone, 
  Mail, 
  KeyRound, 
  Copy, 
  Check, 
  Send, 
  Info,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { sendEmailVerification } from 'firebase/auth';

interface VerifyOtpPageProps {
  onSuccess: () => void;
}

export const VerifyOtpPage: React.FC<VerifyOtpPageProps> = ({ onSuccess }) => {
  const { 
    currentUser, 
    userProfile, 
    sendLoginOtpCode, 
    verifyLoginOtp, 
    checkEmailVerificationStatus, 
    activeOtpCode, 
    logout 
  } = useAuth();
  
  const { success, error: toastError } = useToast();

  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [sendingEmailLink, setSendingEmailLink] = useState(false);
  const [emailSentNotice, setEmailSentNotice] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'emailLink' | 'otpCode'>('emailLink');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initial code generation on mount
  useEffect(() => {
    if (currentUser && !activeOtpCode) {
      sendLoginOtpCode().catch(console.error);
    }
  }, [currentUser]);

  // 1. AUTOMATIC BACKGROUND POLLING FOR SMTP EMAIL VERIFICATION
  useEffect(() => {
    if (!currentUser) return;
    
    const interval = setInterval(async () => {
      try {
        const res = await checkEmailVerificationStatus();
        if (res.verified) {
          clearInterval(interval);
          success(res.message);
          onSuccess();
        }
      } catch (err) {
        // silent background check
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentUser]);

  // Countdown timer for resend
  useEffect(() => {
    let timer: any = null;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Handle manual "Check Email Link" button click
  const handleManualEmailCheck = async () => {
    setCheckingEmail(true);
    setErrorMsg('');
    try {
      const res = await checkEmailVerificationStatus();
      if (res.verified) {
        success(res.message);
        onSuccess();
      } else {
        setErrorMsg('لم يتم رصد تأكيد البريد بعد. يرجى فتح رسالة الإيميل والضغط على رابط التفعيل ثم المحاولة مجدداً.');
        toastError('لم يتم تأكيد الرابط بعد من صندوق بريدك.');
      }
    } catch (err: any) {
      setErrorMsg('حدث خطأ أثناء فحص حالة البريد.');
    } finally {
      setCheckingEmail(false);
    }
  };

  // Send or resend official Firebase Auth verification email via SMTP
  const handleSendOfficialEmail = async () => {
    if (!currentUser) return;
    try {
      setSendingEmailLink(true);
      setErrorMsg('');
      await sendEmailVerification(currentUser);
      setEmailSentNotice(true);
      setCountdown(60);
      success(`تم إرسال رسالة التفعيل عبر SMTP إلى بريدك (${currentUser.email}).`);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/too-many-requests') {
        toastError('تم إرسال رسالة مؤخراً. يرجى مراجعة صندوق الوارد ورسائل Spam/Junk.');
      } else {
        toastError(err.message || 'فشل إرسال رسالة البريد الإلكتروني.');
      }
    } finally {
      setSendingEmailLink(false);
    }
  };

  // Auto-fill active OTP
  const handleAutoFill = () => {
    if (!activeOtpCode) return;
    const digits = activeOtpCode.slice(0, 6).split('');
    setOtpDigits(digits);
    success('تم تعبئة رمز التحقق تلقائياً!');
  };

  const handleCopyCode = () => {
    if (!activeOtpCode) return;
    navigator.clipboard.writeText(activeOtpCode);
    setCopied(true);
    success('تم نسخ رمز التحقق.');
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle single digit changes & auto focus
  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      const cleanDigits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otpDigits];
      cleanDigits.forEach((d, i) => {
        newOtp[i] = d;
      });
      setOtpDigits(newOtp);
      const nextFocus = Math.min(cleanDigits.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newOtp = [...otpDigits];
    newOtp[index] = digit;
    setOtpDigits(newOtp);

    // Auto advance focus
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtp = ['', '', '', '', '', ''];
    pastedData.split('').forEach((char, idx) => {
      newOtp[idx] = char;
    });
    setOtpDigits(newOtp);
    const nextIdx = Math.min(pastedData.length, 5);
    inputRefs.current[nextIdx]?.focus();
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullCode = otpDigits.join('');

    if (fullCode.length !== 6) {
      setErrorMsg('يرجى إدخال رمز التحقق المكون من 6 أرقام كاملاً.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const res = await verifyLoginOtp(fullCode);

      if (res.success) {
        success(res.message);
        onSuccess();
      } else {
        setErrorMsg(res.message);
        toastError(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل التحقق من الرمز.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    try {
      setErrorMsg('');
      await sendLoginOtpCode();
      setCountdown(60);
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      success('تم توليد كود تحقق جديد.');
    } catch (err: any) {
      toastError('فشل إعادة توليد الرمز.');
    }
  };

  // Auto submit when all 6 digits entered
  useEffect(() => {
    if (activeTab === 'otpCode' && otpDigits.every((d) => d !== '')) {
      handleVerifyOtp();
    }
  }, [otpDigits, activeTab]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-10 selection:bg-emerald-500 selection:text-white relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-2.5">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-950">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">تأكيد وتوثيق الحساب</h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
            مطلوب لتأمين حسابك قبل الدخول للمنصة ({currentUser?.email})
          </p>
        </div>

        {/* Verification Options Tabs */}
        <div className="flex rounded-2xl bg-slate-900/90 p-1.5 border border-slate-800 gap-1.5 shadow-xl">
          <button
            type="button"
            onClick={() => setActiveTab('emailLink')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'emailLink'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>رسالة البريد (SMTP Link)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('otpCode')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'otpCode'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>رمز الأمان السريع (OTP)</span>
          </button>
        </div>

        {/* Main Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* TAB 1: SMTP EMAIL VERIFICATION LINK */}
          {activeTab === 'emailLink' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2.5 text-xs font-bold text-slate-200">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>نظام التحقق الحي من رسائل البريد:</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  1. افتح صندوق الوارد لبريدك: <strong className="text-white font-mono">{currentUser?.email}</strong><br />
                  2. اضغط على رابط التفعيل الموجود في الرسالة.<br />
                  3. بمجرد الضغط، ستتعرف المنصة تلقائياً على التفعيل وتفتح لك لوحة التحكم فوراً!
                </p>
                <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  💡 تأكد من فحص مجلد الرسائل غير المرغوب فيها (Spam / Junk) إن لم تجدها في البريد الوارد.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleManualEmailCheck}
                  disabled={checkingEmail}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-950 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className={`w-5 h-5 ${checkingEmail ? 'animate-spin' : ''}`} />
                  <span>{checkingEmail ? 'جارِ فحص حالة البريد...' : 'لقد ضغطت على الرابط (فحص وتأكيد الدخول)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendOfficialEmail}
                  disabled={sendingEmailLink || countdown > 0}
                  className={`w-full py-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                    countdown > 0
                      ? 'bg-slate-950 text-slate-500 border-slate-800 cursor-not-allowed'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  <Send className="w-4 h-4 text-emerald-400" />
                  <span>
                    {sendingEmailLink 
                      ? 'جارِ إرسال الرسالة...' 
                      : countdown > 0 
                      ? `إعادة إرسال رسالة جديدة بعد (${countdown}ث)` 
                      : 'إرسال رسالة تفعيل جديدة إلى بريدي'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: INSTANT 6-DIGIT OTP CODE */}
          {activeTab === 'otpCode' && (
            <div className="space-y-6">
              {activeOtpCode && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-teal-950/80 border border-emerald-500/40 text-center space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <Smartphone className="w-4 h-4" />
                      <span>رمز الأمان المولد لجهازك:</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
                    </button>
                  </div>

                  <div className="text-3xl font-black tracking-widest font-mono text-emerald-300 bg-slate-950/90 py-2.5 rounded-xl border border-emerald-500/30 select-all shadow-inner">
                    {activeOtpCode}
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoFill}
                    className="w-full py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>تعبئة الكود تلقائياً وتأكيد الدخول</span>
                  </button>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 text-center block">
                    أدخل رمز الأمان (6 أرقام):
                  </label>
                  <div className="flex items-center justify-center gap-2 sm:gap-3" dir="ltr">
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          inputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        autoFocus={index === 0}
                        className="w-11 h-13 sm:w-13 sm:h-15 bg-slate-950 border-2 border-slate-800 focus:border-emerald-500 focus:bg-slate-900 rounded-2xl text-center text-xl sm:text-2xl font-black font-mono text-emerald-400 outline-none transition-all shadow-inner"
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otpDigits.some((d) => d === '')}
                  className={`w-full py-3.5 rounded-2xl font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 ${
                    !otpDigits.some((d) => d === '')
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                  <span>{loading ? 'جارِ التحقق...' : 'تأكيد الرمز والدخول'}</span>
                </button>
              </form>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-slate-800 text-center space-y-3">
            <button
              type="button"
              onClick={async () => {
                await logout();
              }}
              className="text-xs text-slate-500 hover:text-rose-400 transition-colors"
            >
              تسجيل الخروج والتبديل لحساب آخر
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
