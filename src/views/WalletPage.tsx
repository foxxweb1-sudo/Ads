import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Coins, 
  ArrowUpRight, 
  TrendingUp, 
  History, 
  ArrowDownLeft, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Filter,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { dbRefs } from '../lib/firebase';
import { Transaction, Withdrawal, PlatformSettings } from '../types';
import { onValue } from 'firebase/database';
import { DEFAULT_SETTINGS } from '../lib/constants';

interface WalletPageProps {
  onNavigate: (path: string) => void;
}

export const WalletPage: React.FC<WalletPageProps> = ({ onNavigate }) => {
  const { userProfile, currentUser } = useAuth();
  const { success, error: toastError } = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);
  const [filterType, setFilterType] = useState<string>('All');
  const [convertPointsInput, setConvertPointsInput] = useState<number>(1000);

  useEffect(() => {
    const unsubSettings = onValue(dbRefs.settings(), (snap) => {
      if (snap.exists()) setSettings(snap.val());
    });
    return () => unsubSettings();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const unsubTx = onValue(dbRefs.transactions(), (snap) => {
      if (snap.exists()) {
        const all: Record<string, Transaction> = snap.val();
        const userTxs = Object.values(all)
          .filter((t) => t.userId === currentUser.uid)
          .sort((a, b) => b.timestamp - a.timestamp);
        setTransactions(userTxs);
      } else {
        setTransactions([]);
      }
    });

    const unsubWd = onValue(dbRefs.withdrawals(), (snap) => {
      if (snap.exists()) {
        const all: Record<string, Withdrawal> = snap.val();
        const userWds = Object.values(all)
          .filter((w) => w.userId === currentUser.uid)
          .sort((a, b) => b.createdAt - a.createdAt);
        setWithdrawals(userWds);
      } else {
        setWithdrawals([]);
      }
    });

    return () => {
      unsubTx();
      unsubWd();
    };
  }, [currentUser]);

  const pendingWithdrawalTotal = withdrawals
    .filter((w) => w.status === 'Pending' || w.status === 'Processing')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const pointsConversionRate = settings.pointsPerCurrencyUnit || 100;
  const estimatedCashFromPoints = (convertPointsInput / pointsConversionRate).toFixed(2);

  const filteredTransactions = transactions.filter((t) => {
    if (filterType === 'All') return true;
    return t.type === filterType;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">المحفظة والرصيد</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            إدارة رصيدك المالي، متابعة النقاط، وسحب الأرباح إلى محفظتك الإلكترونية أو البنك.
          </p>
        </div>

        <button
          onClick={() => onNavigate('/withdraw')}
          className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-900/30 transition-all flex items-center gap-2 hover:scale-105"
        >
          <ArrowUpRight className="w-5 h-5" />
          <span>طلب سحب أرباح</span>
        </button>
      </div>

      {/* FINANCIAL SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Balance Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">الرصيد المتاح للسحب</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-emerald-400">
              {(userProfile?.balance || 0).toFixed(2)}{' '}
              <span className="text-xs text-slate-400 font-normal">{settings.currencySymbol || 'ج.م'}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>متاح للتحويل فوراً</span>
            </div>
          </div>
        </div>

        {/* Points Card */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">النقاط الحالية</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-amber-400">
              {(userProfile?.points || 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {pointsConversionRate} نقطة = 1 {settings.currencySymbol || 'ج.م'}
            </div>
          </div>
        </div>

        {/* Total Withdrawn */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">إجمالي المسحوبات</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-white">
              {(userProfile?.totalWithdrawn || 0).toFixed(2)}{' '}
              <span className="text-xs text-slate-400 font-normal">{settings.currencySymbol || 'ج.م'}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              تم تحويلها بنجاح
            </div>
          </div>
        </div>

        {/* Pending Withdrawals */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">سحوبات قيد المعالجة</span>
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-cyan-400">
              {pendingWithdrawalTotal.toFixed(2)}{' '}
              <span className="text-xs text-slate-400 font-normal">{settings.currencySymbol || 'ج.م'}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {withdrawals.filter((w) => w.status === 'Pending').length} طلب سحب معلق
            </div>
          </div>
        </div>
      </div>

      {/* POINTS TO CASH CALCULATOR WIDGET */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">حاسبة ومحول النقاط</h3>
            <p className="text-xs text-slate-400">سعر الصرف المعتمد في المنصة: كل {pointsConversionRate} نقطة = 1.00 {settings.currencySymbol || 'ج.م'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 items-center">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400">عدد النقاط:</label>
            <input
              type="number"
              min="100"
              step="100"
              value={convertPointsInput}
              onChange={(e) => setConvertPointsInput(Math.max(0, Number(e.target.value)))}
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 px-4 text-xs sm:text-sm text-slate-100 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400">القيمة بالجنيه المصري:</label>
            <div className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-xs sm:text-sm font-bold text-emerald-400">
              {estimatedCashFromPoints} {settings.currencySymbol || 'ج.م'}
            </div>
          </div>

          <div className="sm:pt-5">
            <button
              onClick={() => onNavigate('/tasks')}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors border border-slate-700"
            >
              جمع المزيد من النقاط
            </button>
          </div>
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">سجل العمليات المالية (Transaction History)</h2>
            <p className="text-xs text-slate-400">كشف حساب مفصل لجميع المكافآت وعمولات الإحالة وعمليات السحب</p>
          </div>

          {/* Filter Types */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            {['All', 'Task Reward', 'Referral Reward', 'Withdrawal', 'Bonus', 'Refund'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  filterType === type
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {type === 'All' ? 'الكل' : type}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-2">
              <History className="w-8 h-8 text-slate-600 mx-auto" />
              <p>لا توجد معاملات مسجلة في هذا القسم بعد.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-bold">
                  <tr>
                    <th className="py-4 px-6">نوع العملية</th>
                    <th className="py-4 px-6">الوصف / المرجع</th>
                    <th className="py-4 px-6">المبلغ</th>
                    <th className="py-4 px-6">النقاط</th>
                    <th className="py-4 px-6">الحالة</th>
                    <th className="py-4 px-6">التاريخ والوقت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                          tx.type === 'Task Reward' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : tx.type === 'Referral Reward'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : tx.type === 'Withdrawal'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : tx.type === 'Bonus'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-200 max-w-xs truncate">
                        {tx.description}
                      </td>
                      <td className="py-4 px-6 font-black font-mono">
                        <span className={tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {tx.amount >= 0 ? '+' : ''}{tx.amount.toFixed(2)} {settings.currencySymbol || 'ج.م'}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono text-amber-400">
                        {tx.points ? `+${tx.points.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          tx.status === 'completed' 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : tx.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {tx.status === 'completed' ? 'مكتمل' : tx.status === 'pending' ? 'قيد المعالجة' : 'مرفوض'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(tx.timestamp).toLocaleString('ar-EG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
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
