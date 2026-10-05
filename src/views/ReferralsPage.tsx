import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Copy, 
  Check, 
  Sparkles, 
  Gift, 
  TrendingUp, 
  Award, 
  Share2, 
  MessageSquare, 
  Send,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { dbRefs } from '../lib/firebase';
import { UserProfile, LevelConfig, PlatformSettings } from '../types';
import { onValue } from 'firebase/database';
import { DEFAULT_LEVELS, DEFAULT_SETTINGS } from '../lib/constants';

export const ReferralsPage: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const { success } = useToast();

  const [copied, setCopied] = useState(false);
  const [referralsList, setReferralsList] = useState<UserProfile[]>([]);
  const [levels, setLevels] = useState<Record<string, LevelConfig>>(DEFAULT_LEVELS);
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const unsubSettings = onValue(dbRefs.settings(), (snap) => {
      if (snap.exists()) setSettings(snap.val());
    });
    const unsubLevels = onValue(dbRefs.levels(), (snap) => {
      if (snap.exists()) setLevels(snap.val());
    });
    return () => {
      unsubSettings();
      unsubLevels();
    };
  }, []);

  // Fetch referrals
  useEffect(() => {
    if (!userProfile?.referralCode) return;
    const unsub = onValue(dbRefs.users(), (snap) => {
      if (snap.exists()) {
        const all: Record<string, UserProfile> = snap.val();
        const referred = Object.values(all)
          .filter((u) => u.referredBy === userProfile.referralCode && u.uid !== userProfile.uid)
          .sort((a, b) => b.createdAt - a.createdAt);
        setReferralsList(referred);
      } else {
        setReferralsList([]);
      }
    });
    return () => unsub();
  }, [userProfile]);

  const userLevel = userProfile?.level || 'Bronze';
  const levelInfo = levels[userLevel] || DEFAULT_LEVELS.Bronze;
  const currentCommission = levelInfo.referralPercentage || settings.defaultReferralPercentage || 5;

  const referralUrl = `${window.location.origin}/register?ref=${userProfile?.referralCode || ''}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    success('تم نسخ رابط الإحالة بنجاح!');
    setTimeout(() => setCopied(false), 2500);
  };

  const shareText = encodeURIComponent(`اكسب المال من تنفيذ المهام اليومية مع منصة SmartEarn! سجل الآن عبر رابطي وابدأ في جمع النقاط والأرباح: ${referralUrl}`);

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              نسبة عمولتك الحالية: {currentCommission}%
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">برنامج الإحالات ودعوة الأصدقاء</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            شارك رابطك مع أصدقائك واكسب حتى 20% عمولة فورية من أرباح جميع مهامهم مدى الحياة!
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs shrink-0 space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <Gift className="w-4 h-4 text-cyan-400" />
            <span>ربح سلبي مستمر</span>
          </div>
          <p className="text-[11px] text-slate-400">تضاف عمولة الإحالة تلقائياً لمحفظتك فور إكمال صديقك لأي مهمة.</p>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">إجمالي الأصدقاء المسجلين</span>
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{referralsList.length}</div>
          <div className="text-[11px] text-slate-400">مستخدم عبر كودك الخاص</div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">إجمالي أرباح الإحالات</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400">
            {(userProfile?.referralEarnings || 0).toFixed(2)} {settings.currencySymbol || 'ج.م'}
          </div>
          <div className="text-[11px] text-slate-400">تم إضافتها مباشرة لرصيدك</div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">نسبة العمولة لمستواك</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-400">{currentCommission}%</div>
          <div className="text-[11px] text-slate-400">تصل إلى 20% في المستوى الماسي</div>
        </div>
      </div>

      {/* SHARE LINK BOX */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="space-y-2">
          <h2 className="text-base font-bold text-white">رابط وكود الإحالة الخاص بك</h2>
          <p className="text-xs text-slate-400">انسخ الرابط وشاركه عبر مجموعات فيسبوك، واتساب وتليجرام لجذب المزيد من المستخدمين.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:flex-1 bg-slate-950 px-4 py-3 rounded-2xl border border-slate-800 text-xs sm:text-sm font-mono text-slate-200 truncate" dir="ltr">
            {referralUrl}
          </div>
          <button
            onClick={handleCopy}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 shrink-0"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'تم النسخ بنجاح!' : 'نسخ الرابط'}</span>
          </button>
        </div>

        {/* Social Sharing Buttons */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-slate-300">مشاركة سريعة:</span>
          <a
            href={`https://api.whatsapp.com/send?text=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>واتساب</span>
          </a>
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>تليجرام</span>
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold transition-colors flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span>فيسبوك</span>
          </a>
        </div>
      </div>

      {/* REFERRAL TIERS TABLE */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white">جدول نسب الإحالة حسب المستويات</h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {Object.values(levels).map((lvl) => (
            <div
              key={lvl.id}
              className={`p-4 rounded-2xl border text-center space-y-2 ${
                lvl.id === userLevel
                  ? 'bg-emerald-950/30 border-emerald-500 shadow-md'
                  : 'bg-slate-950 border-slate-800'
              }`}
            >
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${lvl.badgeColor}`}>
                {lvl.nameAr}
              </span>
              <div className="text-xl font-black text-emerald-400">{lvl.referralPercentage}%</div>
              <div className="text-[10px] text-slate-400">عمولة على كل مهمة</div>
            </div>
          ))}
        </div>
      </div>

      {/* REFERRED USERS LIST */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white">قائمة الأصدقاء المسجلين من خلالك ({referralsList.length})</h3>

        <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          {referralsList.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-2">
              <Users className="w-8 h-8 text-slate-600 mx-auto" />
              <p>لم يسجل أي صديق عبر رابطك بعد. ابدأ بمشاركة الرابط الآن!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-bold">
                  <tr>
                    <th className="py-4 px-6">المستخدم</th>
                    <th className="py-4 px-6">المستوى</th>
                    <th className="py-4 px-6">المهام المكتملة</th>
                    <th className="py-4 px-6">تاريخ الانضمام</th>
                    <th className="py-4 px-6">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {referralsList.map((refUser) => (
                    <tr key={refUser.uid} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-100 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400 font-bold text-xs">
                          {(refUser.displayName || refUser.username).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div>{refUser.displayName || refUser.username}</div>
                          <div className="text-[10px] text-slate-500 font-mono">@{refUser.username}</div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-semibold text-amber-400">
                        {refUser.level}
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-200">
                        {refUser.completedTasks || 0} مهمة
                      </td>
                      <td className="py-4 px-6 text-slate-400 text-[11px]">
                        {new Date(refUser.createdAt).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                          نشط
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
