import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Ban, CheckCircle2, UserX, Search, Eye, Filter } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { dbRefs } from '../../lib/firebase';
import { UserProfile, AccountStatus, TaskCompletion, LoginLog } from '../../types';
import { onValue, update } from 'firebase/database';
import { logActivity } from '../../lib/dbService';

export const AdminFraud: React.FC = () => {
  const { userProfile: currentAdmin } = useAuth();
  const { success, error: toastError } = useToast();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsubU = onValue(dbRefs.users(), (s) => s.exists() ? setUsers(Object.values(s.val())) : setUsers([]));
    const unsubC = onValue(dbRefs.taskCompletions(), (s) => s.exists() ? setCompletions(Object.values(s.val())) : setCompletions([]));
    const unsubL = onValue(dbRefs.loginLogs(), (s) => s.exists() ? setLoginLogs(Object.values(s.val())) : setLoginLogs([]));

    return () => {
      unsubU();
      unsubC();
      unsubL();
    };
  }, []);

  // Compute fraud flags dynamically
  const flaggedUsers = users.map((u) => {
    let riskScore = 0;
    const reasons: string[] = [];

    // Check duplicate IP / accounts
    const userLogins = loginLogs.filter((l) => l.userId === u.uid);
    const userIps = Array.from(new Set(userLogins.map((l) => l.ip).filter(Boolean)));
    
    // Check if other users share the same IP
    const otherUsersWithSameIp = users.filter((other) => {
      if (other.uid === u.uid) return false;
      const otherLogs = loginLogs.filter((l) => l.userId === other.uid);
      return otherLogs.some((l) => userIps.includes(l.ip));
    });

    if (otherUsersWithSameIp.length > 0) {
      riskScore += 30;
      reasons.push(`مشاركة نفس عنوان الـ IP مع ${otherUsersWithSameIp.length} حساب آخر (${otherUsersWithSameIp.map(o => o.username).slice(0, 3).join(', ')})`);
    }

    // Check task velocity
    const userComps = completions.filter((c) => c.userId === u.uid);
    if (userComps.length > 30) {
      riskScore += 15;
    }

    // Check failed logins
    const failedLogins = loginLogs.filter((l) => l.userId === u.uid && l.status === 'Failed Login').length;
    if (failedLogins >= 5) {
      riskScore += 25;
      reasons.push(`عدد محاولات تسجيل دخول فاشلة مرتفع (${failedLogins} محاولات)`);
    }

    // Check if banned
    if (u.accountStatus === 'banned') {
      riskScore += 50;
      reasons.push('تم حظر الحساب مسبقاً');
    } else if (u.accountStatus === 'under_review') {
      riskScore += 20;
      reasons.push('الحساب قيد المراجعة والتدقيق');
    }

    let riskLevel: 'Normal' | 'Suspicious' | 'High Risk' | 'Blocked' = 'Normal';
    if (u.accountStatus === 'banned') riskLevel = 'Blocked';
    else if (riskScore >= 40) riskLevel = 'High Risk';
    else if (riskScore >= 15) riskLevel = 'Suspicious';

    return {
      user: u,
      riskScore,
      riskLevel,
      reasons: reasons.length ? reasons : ['النشاط طبيعي ومنتظم']
    };
  });

  const handleUpdateStatus = async (uid: string, status: AccountStatus) => {
    if (!currentAdmin) return;
    try {
      await update(dbRefs.user(uid), { accountStatus: status });
      await logActivity({
        actorId: currentAdmin.uid,
        actorEmail: currentAdmin.email,
        targetUserId: uid,
        action: `Account Status changed to ${status}`,
        description: `تغيير حالة الحساب إلى ${status} من نظام كشف الاحتيال`
      });
      success(`تم تحديث حالة الحساب إلى ${status}.`);
    } catch (err: any) {
      toastError('فشل التحديث.');
    }
  };

  const filtered = flaggedUsers.filter(({ user, riskLevel }) => {
    const matchSearch = 
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      (user.displayName || '').toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">نظام كشف الاحتيال ومكافحة التلاعب (Fraud Detection)</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            تحليل آلي للأنشطة المشبوهة، رصد الحسابات المتعددة على نفس الـ IP، ومحاولات الغش في المهام.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-rose-400 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
            {flaggedUsers.filter((f) => f.riskLevel === 'High Risk' || f.riskLevel === 'Blocked').length} حسابات مشبوهة / محظورة
          </span>
        </div>
      </div>

      <div className="relative w-full">
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث عن مستخدم مشبوه..."
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-2.5 pr-10 pl-4 text-xs sm:text-sm text-slate-100 outline-none"
        />
      </div>

      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-bold">
              <tr>
                <th className="py-4 px-6">المستخدم</th>
                <th className="py-4 px-6">مستوى الخطورة</th>
                <th className="py-4 px-6">أسباب وتفاصيل الرصد</th>
                <th className="py-4 px-6">الرصيد والنقاط</th>
                <th className="py-4 px-6">الحالة الحالية</th>
                <th className="py-4 px-6 text-center">إجراءات الأمان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map(({ user: u, riskLevel, reasons, riskScore }) => (
                <tr key={u.uid} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-100">{u.displayName || u.username}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{u.email}</div>
                  </td>

                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                      riskLevel === 'High Risk'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : riskLevel === 'Blocked'
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : riskLevel === 'Suspicious'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {riskLevel === 'High Risk' ? '🚨 خطورة عالية' : riskLevel === 'Blocked' ? '⛔ محظور' : riskLevel === 'Suspicious' ? '⚠️ مشبوه' : '✅ طبيعي'}
                    </span>
                  </td>

                  <td className="py-4 px-6 max-w-sm">
                    <ul className="text-[11px] text-slate-300 space-y-0.5 list-disc list-inside">
                      {reasons.map((r, i) => (
                        <li key={i} className="truncate">{r}</li>
                      ))}
                    </ul>
                  </td>

                  <td className="py-4 px-6 font-mono font-bold">
                    <div className="text-emerald-400">{u.balance.toFixed(2)} ج.م</div>
                    <div className="text-[10px] text-amber-400">{u.points} نقطة</div>
                  </td>

                  <td className="py-4 px-6">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 font-bold text-slate-300">
                      {u.accountStatus}
                    </span>
                  </td>

                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-1.5">
                      {u.accountStatus !== 'banned' ? (
                        <button
                          onClick={() => handleUpdateStatus(u.uid, 'banned')}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] transition-colors"
                        >
                          حظر الحساب
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(u.uid, 'active')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition-colors"
                        >
                          إلغاء الحظر
                        </button>
                      )}
                      {u.accountStatus === 'active' && (
                        <button
                          onClick={() => handleUpdateStatus(u.uid, 'under_review')}
                          className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] transition-colors"
                        >
                          وضع للمراجعة
                        </button>
                      )}
                    </div>
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
