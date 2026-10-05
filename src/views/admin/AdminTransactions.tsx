import React, { useState, useEffect } from 'react';
import { History, Search, Filter, Coins, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { dbRefs } from '../../lib/firebase';
import { Transaction, PlatformSettings } from '../../types';
import { onValue } from 'firebase/database';
import { DEFAULT_SETTINGS } from '../../lib/constants';

export const AdminTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const unsubSettings = onValue(dbRefs.settings(), (s) => s.exists() && setSettings(s.val()));
    const unsub = onValue(dbRefs.transactions(), (snap) => {
      if (snap.exists()) {
        const all: Record<string, Transaction> = snap.val();
        setTransactions(Object.values(all).sort((a, b) => b.timestamp - a.timestamp));
      } else {
        setTransactions([]);
      }
    });
    return () => {
      unsubSettings();
      unsub();
    };
  }, []);

  const filtered = transactions.filter((t) => {
    const matchType = filterType === 'All' || t.type === filterType;
    const matchSearch = 
      (t.userName || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.userEmail || '').toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-black text-white">سجل المعاملات المالية الشامل (Audit Ledger)</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          متابعة وتدقيق جميع التدفقات المالية، الأرباح، والعمولات المسجلة في النظام.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالمستخدم، الإيميل أو الوصف..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-2.5 pr-10 pl-4 text-xs sm:text-sm text-slate-100 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['All', 'Task Reward', 'Referral Reward', 'Withdrawal', 'Bonus', 'Adjustment', 'Refund'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterType === t
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {t === 'All' ? 'الكل' : t}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-bold">
              <tr>
                <th className="py-4 px-6">المستخدم</th>
                <th className="py-4 px-6">النوع</th>
                <th className="py-4 px-6">الوصف</th>
                <th className="py-4 px-6">المبلغ</th>
                <th className="py-4 px-6">النقاط</th>
                <th className="py-4 px-6">الحالة</th>
                <th className="py-4 px-6">التاريخ والوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    لا توجد معاملات مطابقة للبحث.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-100">{tx.userName || tx.userId}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{tx.userEmail}</div>
                    </td>

                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
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

                    <td className="py-4 px-6 max-w-xs truncate text-slate-200">
                      {tx.description}
                    </td>

                    <td className="py-4 px-6 font-black font-mono">
                      <span className={tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {tx.amount >= 0 ? '+' : ''}{tx.amount.toFixed(2)} {settings.currencySymbol || 'ج.م'}
                      </span>
                    </td>

                    <td className="py-4 px-6 font-mono text-amber-400">
                      {tx.points ? `+${tx.points}` : '-'}
                    </td>

                    <td className="py-4 px-6">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {tx.status}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(tx.timestamp).toLocaleString('ar-EG')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
