import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckSquare, 
  Wallet, 
  ArrowUpRight, 
  TrendingUp, 
  ShieldCheck, 
  Activity, 
  Coins, 
  Sparkles, 
  AlertCircle,
  Clock,
  CheckCircle2,
  Sliders,
  DollarSign
} from 'lucide-react';
import { dbRefs } from '../../lib/firebase';
import { UserProfile, Task, TaskCompletion, Withdrawal, Transaction, UserPresence, PlatformSettings } from '../../types';
import { onValue } from 'firebase/database';
import { DEFAULT_SETTINGS } from '../../lib/constants';

interface AdminOverviewProps {
  onNavigate: (path: string) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ onNavigate }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [presences, setPresences] = useState<UserPresence[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const unsubSettings = onValue(dbRefs.settings(), (s) => s.exists() && setSettings(s.val()));
    const unsubUsers = onValue(dbRefs.users(), (s) => s.exists() ? setUsers(Object.values(s.val())) : setUsers([]));
    const unsubPres = onValue(dbRefs.allPresence(), (s) => s.exists() ? setPresences(Object.values(s.val())) : setPresences([]));
    const unsubTasks = onValue(dbRefs.tasks(), (s) => s.exists() ? setTasks(Object.values(s.val())) : setTasks([]));
    const unsubComp = onValue(dbRefs.taskCompletions(), (s) => s.exists() ? setCompletions(Object.values(s.val())) : setCompletions([]));
    const unsubWd = onValue(dbRefs.withdrawals(), (s) => s.exists() ? setWithdrawals(Object.values(s.val())) : setWithdrawals([]));
    const unsubTx = onValue(dbRefs.transactions(), (s) => s.exists() ? setTransactions(Object.values(s.val())) : setTransactions([]));

    return () => {
      unsubSettings();
      unsubUsers();
      unsubPres();
      unsubTasks();
      unsubComp();
      unsubWd();
      unsubTx();
    };
  }, []);

  const onlineUsersCount = presences.filter((p) => p.state === 'online').length;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayTimestamp = todayStart.getTime();

  const todayRegistrations = users.filter((u) => u.createdAt >= todayTimestamp).length;
  const todayActiveUsers = users.filter((u) => (u.lastActiveAt || 0) >= todayTimestamp).length;

  const activeTasksCount = tasks.filter((t) => t.status === 'Active').length;
  const totalCompletedTasksCount = completions.length;

  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'Pending' || w.status === 'Processing');
  const pendingWithdrawalsTotal = pendingWithdrawals.reduce((acc, curr) => acc + curr.amount, 0);

  const paidWithdrawals = withdrawals.filter((w) => w.status === 'Paid');
  const paidWithdrawalsTotal = paidWithdrawals.reduce((acc, curr) => acc + curr.amount, 0);

  const totalUserBalanceLiability = users.reduce((acc, curr) => acc + (curr.balance || 0), 0);
  const totalReferralEarningsPaid = users.reduce((acc, curr) => acc + (curr.referralEarnings || 0), 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 uppercase">
              لوحة القيادة المركزية (Admin Control)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">نظرة عامة وإحصائيات المنصة الحية</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            متابعة حية للمستخدمين، طلبات السحب، تدفق الأموال، ونشاط المهام بالكامل.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/admin/withdrawals')}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-amber-950 transition-all flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            <span>معالجة السحوبات ({pendingWithdrawals.length})</span>
          </button>
        </div>
      </div>

      {/* METRICS CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Users */}
        <div 
          onClick={() => onNavigate('/admin/users')}
          className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">إجمالي المستخدمين</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-white">{users.length}</div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{onlineUsersCount} متصل الآن</span>
            </div>
          </div>
        </div>

        {/* Pending Withdrawals */}
        <div 
          onClick={() => onNavigate('/admin/withdrawals')}
          className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">طلبات السحب المعلقة</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-amber-400">
              {pendingWithdrawalsTotal.toFixed(2)} {settings.currencySymbol || 'ج.م'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {pendingWithdrawals.length} طلب بحاجة للمراجعة
            </div>
          </div>
        </div>

        {/* Total User Balances (Liabilities) */}
        <div 
          onClick={() => onNavigate('/admin/users')}
          className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">التزامات أرصدة الأعضاء</span>
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-white">
              {totalUserBalanceLiability.toFixed(2)} {settings.currencySymbol || 'ج.م'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              في محافظ المستخدمين حالياً
            </div>
          </div>
        </div>

        {/* Paid Withdrawals */}
        <div 
          onClick={() => onNavigate('/admin/withdrawals')}
          className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-all cursor-pointer space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">إجمالي السحوبات المدفوعة</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-purple-400">
              {paidWithdrawalsTotal.toFixed(2)} {settings.currencySymbol || 'ج.م'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              تم تحويلها لـ {paidWithdrawals.length} مستخدم
            </div>
          </div>
        </div>
      </div>

      {/* SECONDARY STATS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-bold text-slate-400">تسجيلات اليوم</div>
          <div className="text-2xl font-bold text-white mt-1">+{todayRegistrations}</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-bold text-slate-400">المستخدمين النشطين اليوم</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{todayActiveUsers}</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-bold text-slate-400">المهام النشطة</div>
          <div className="text-2xl font-bold text-teal-400 mt-1">{activeTasksCount} من {tasks.length}</div>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-bold text-slate-400">إجمالي المهام المكتملة</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1">{totalCompletedTasksCount}</div>
        </div>
      </div>

      {/* RECENT WITHDRAWALS & LIVE ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Withdrawals Queue */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>طلبات سحب بانتظار الموافقة ({pendingWithdrawals.length})</span>
            </h3>
            <button
              onClick={() => onNavigate('/admin/withdrawals')}
              className="text-xs text-amber-400 font-bold hover:underline"
            >
              إدارة الكل
            </button>
          </div>

          <div className="space-y-3">
            {pendingWithdrawals.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                لا توجد طلبات سحب معلقة حالياً. جميع الطلبات معالجة! 👍
              </div>
            ) : (
              pendingWithdrawals.slice(0, 4).map((w) => (
                <div
                  key={w.id}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-100">{w.userName}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {w.paymentMethodName} • {new Date(w.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black text-amber-400">
                      {w.amount.toFixed(2)} {settings.currencySymbol || 'ج.م'}
                    </div>
                    <button
                      onClick={() => onNavigate('/admin/withdrawals')}
                      className="text-[11px] font-bold text-emerald-400 hover:underline"
                    >
                      معالجة الآن
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Platform Presence & Online Users */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span>المتواجدون الآن في المنصة ({onlineUsersCount})</span>
            </h3>
            <button
              onClick={() => onNavigate('/admin/login-logs')}
              className="text-xs text-slate-400 font-bold hover:text-white"
            >
              سجلات الأمان
            </button>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {presences.filter((p) => p.state === 'online').length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                لا يوجد مستخدمون متصلون في هذه اللحظة.
              </div>
            ) : (
              presences
                .filter((p) => p.state === 'online')
                .map((p) => (
                  <div
                    key={p.uid}
                    className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <div className="overflow-hidden">
                        <div className="font-bold text-slate-200 truncate">{p.displayName || p.email}</div>
                        <div className="text-[10px] text-slate-400">{p.device} • {p.browser}</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                      متصل
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
