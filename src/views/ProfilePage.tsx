import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Shield, 
  Sparkles, 
  Coins, 
  Wallet, 
  Users, 
  Check, 
  Copy, 
  Calendar, 
  Save, 
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { updatePassword } from 'firebase/auth';

export const ProfilePage: React.FC = () => {
  const { userProfile, currentUser, updateProfileData, resetPassword } = useAuth();
  const { success, error: toastError } = useToast();

  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [photoURL, setPhotoURL] = useState(userProfile?.photoURL || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toastError('يرجى كتابة الاسم الكامل.');
      return;
    }

    try {
      setSavingProfile(true);
      await updateProfileData({
        displayName: displayName.trim(),
        photoURL: photoURL.trim()
      });
      success('تم تحديث بيانات الملف الشخصي بنجاح.');
    } catch (err: any) {
      toastError(err.message || 'فشل تحديث الملف الشخصي.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toastError('كلمة المرور يجب أن لا تقل عن 6 خانات.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError('كلمة المرور وتأكيدها غير متطابقين.');
      return;
    }

    if (!currentUser) return;

    try {
      setSavingPassword(true);
      await updatePassword(currentUser, newPassword);
      success('تم تغيير كلمة المرور بنجاح.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        toastError('لحماية حسابك، يرجى تسجيل الخروج ثم الدخول مجدداً لتغيير كلمة المرور.');
      } else {
        toastError(err.message || 'فشل تحديث كلمة المرور.');
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSendResetLink = async () => {
    if (!userProfile?.email) return;
    try {
      await resetPassword(userProfile.email);
      success('تم إرسال رابط تعيين كلمة المرور إلى بريدك الإلكتروني.');
    } catch (err: any) {
      toastError('فشل إرسال الرابط.');
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      {/* Top Banner with Stats */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-3xl shadow-xl shrink-0 overflow-hidden">
          {userProfile?.photoURL ? (
            <img src={userProfile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            (userProfile?.displayName || userProfile?.username || 'U').charAt(0).toUpperCase()
          )}
        </div>

        <div className="space-y-2 text-center sm:text-right flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {userProfile?.displayName || userProfile?.username}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              مستوى {userProfile?.level}
            </span>
          </div>

          <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-3">
            <span className="font-mono">@{userProfile?.username}</span>
            <span>•</span>
            <span>{userProfile?.email}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>عضو منذ {new Date(userProfile?.createdAt || Date.now()).toLocaleDateString('ar-EG')}</span>
            </span>
          </p>
        </div>
      </div>

      {/* Profile Edit Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Personal Details Form */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center gap-2.5 text-sm font-bold text-white border-b border-slate-800 pb-3">
            <User className="w-4 h-4 text-emerald-400" />
            <span>تعديل البيانات الأساسية</span>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">الاسم المعروض (Display Name)</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="الاسم الكامل"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-xs sm:text-sm text-slate-100 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">رابط الصورة الشخصية (URL)</label>
              <input
                type="url"
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-xs sm:text-sm text-slate-100 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">اسم المستخدم (غير قابل للتعديل)</label>
              <input
                type="text"
                disabled
                value={userProfile?.username || ''}
                className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl py-2.5 px-4 text-xs sm:text-sm text-slate-400 cursor-not-allowed font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">البريد الإلكتروني</label>
              <input
                type="text"
                disabled
                value={userProfile?.email || ''}
                className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl py-2.5 px-4 text-xs sm:text-sm text-slate-400 cursor-not-allowed font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              {savingProfile ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>حفظ التعديلات</span>
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center gap-2.5 text-sm font-bold text-white border-b border-slate-800 pb-3">
            <KeyRound className="w-4 h-4 text-emerald-400" />
            <span>الأمان وتغيير كلمة المرور</span>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">كلمة المرور الجديدة</label>
              <input
                type="password"
                required
                dir="ltr"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-xs sm:text-sm text-slate-100 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">تأكيد كلمة المرور الجديدة</label>
              <input
                type="password"
                required
                dir="ltr"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-xs sm:text-sm text-slate-100 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
            >
              {savingPassword ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              <span>تحديث كلمة المرور</span>
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={handleSendResetLink}
              className="text-xs text-emerald-400 hover:underline"
            >
              أو أرسل رابط إعادة تعيين كلمة المرور إلى بريدك
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
