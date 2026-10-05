import React, { useState, useEffect } from 'react';
import { Layers, Users, Search, TrendingUp, Award, Gift, DollarSign } from 'lucide-react';
import { dbRefs } from '../../lib/firebase';
import { UserProfile, PlatformSettings } from '../../types';
import { onValue } from 'firebase/database';
import { DEFAULT_SETTINGS } from '../../lib/constants';

export const AdminReferrals: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const unsubSettings = onValue(dbRefs.settings(), (s) => s.exists() && setSettings(s.val()));
    const unsub = onValue(dbRefs.users(), (snap) => {
      if (snap.exists()) {
        const all: Record<string, UserProfile> = snap.val();
        setUsers(Object.values(all).sort((a, b) => (b.successfulReferrals || 0) - (a.successfulReferrals || 0)));
      } else {
        setUsers([]);
      }
    });
    return () => {
      unsubSettings();
      unsub();
    };
  }, []);

  const totalReferralsCount = users.reduce((acc, u) => acc + (u.successfulReferrals || 0), 0);
  const totalReferralEarnings = users.reduce((acc, u) => acc + (u.referralEarnings || 0), 0);

  const filtered = users.filter((u) => {
    return (
      (u.displayName || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.referralCode || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">شبكة الإحالات والمتصدرين (Referral Network)</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            متابعة أنشط المسوقين والمستخدمين في دعوة الأصدقاء وحجم العمولات المنفقة.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs">
            <span className="text-slate-400">إجمالي الإحالات: </span>
            <strong className="text-cyan-400 font-mono text-sm">{totalReferralsCount}</strong>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs">
            <span className="text-slate-400">إجمالي العمولات: </span>
            <strong className="text-emerald-400 font-mono text-sm">{totalReferralEarnings.toFixed(2)} {settings.currencySymbol || 'ج.م'}</strong>
          </div>
        </div>
      </div>

      <div className="relative w-full">
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث عن مسوق أو كود إحالة..."
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-2.5 pr-10 pl-4 text-xs sm:text-sm text-slate-100 outline-none"
        />
      </div>

      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-bold">
              <tr>
                <th className="py-4 px-6">المستخدم</th>
                <th className="py-4 px-6">كود الإحالة</th>
                <th className="py-4 px-6">عدد الإحالات الناجحة</th>
                <th className="py-4 px-6">أرباح الإحالات المكتسبة</th>
                <th className="py-4 px-6">المستوى الحالي</th>
                <th className="py-4 px-6">تمت دعوته بواسطة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map((u, idx) => (
                <tr key={u.uid} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-100 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] text-slate-400 flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                    <span>{u.displayName || u.username}</span>
                  </td>

                  <td className="py-4 px-6 font-mono font-bold text-emerald-400">
                    {u.referralCode}
                  </td>

                  <td className="py-4 px-6 font-mono text-cyan-400 font-bold">
                    {u.successfulReferrals || 0} صديق
                  </td>

                  <td className="py-4 px-6 font-mono text-emerald-400 font-black">
                    {(u.referralEarnings || 0).toFixed(2)} {settings.currencySymbol || 'ج.م'}
                  </td>

                  <td className="py-4 px-6 text-amber-400 font-bold">
                    {u.level}
                  </td>

                  <td className="py-4 px-6 font-mono text-slate-400">
                    {u.referredBy || 'تسجيل مباشر'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
