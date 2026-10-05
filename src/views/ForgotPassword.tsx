import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface ForgotPasswordProps {
  onNavigate: (path: string) => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigate }) => {
  const { resetPassword } = useAuth();
  const { success, error: toastError } = useToast();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('يرجى إدخال البريد الإلكتروني.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      await resetPassword(email.trim());
      setSent(true);
      success('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.');
    } catch (err: any) {
      console.error(err);
      let msg = 'فشل إرسال رابط الاستعادة. تأكد من صحة البريد الإلكتروني.';
      if (err.code === 'auth/user-not-found') {
        msg = 'البريد الإلكتروني غير مسجل في النظام.';
      }
      setErrorMsg(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 selection:bg-emerald-500 selection:text-white relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <button
            onClick={() => onNavigate('/login')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>العودة لتسجيل الدخول</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-white">استعادة كلمة المرور</h1>
          <p className="text-xs text-slate-400">أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور</p>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6">
          {sent ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">تم إرسال الرابط بنجاح!</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                تحقق من صندوق الوارد في بريدك الإلكتروني ({email}) واتبع التعليمات لتعيين كلمة مرور جديدة.
              </p>
              <button
                onClick={() => onNavigate('/login')}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg"
              >
                العودة لصفحة تسجيل الدخول
              </button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              {errorMsg && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">البريد الإلكتروني المسجل</label>
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                <span>{loading ? 'جارِ الإرسال...' : 'إرسال رابط إعادة التعيين'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
