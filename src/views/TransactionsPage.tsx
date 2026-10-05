import React, { useState, useEffect } from 'react';
import { History, Search, Filter, ArrowDownLeft, ArrowUpRight, Coins, Calendar, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dbRefs } from '../lib/firebase';
import { Transaction, PlatformSettings } from '../types';
import { onValue } from 'firebase/database';
import { DEFAULT_SETTINGS } from '../lib/constants';

export const TransactionsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const unsubSettings = onValue(dbRefs.settings(), (snap) => {
      if (snap.exists()) setSettings(snap.val());
    });
    return () => unsubSettings();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = onValue(dbRefs.transactions(), (snap) => {
      if (snap.exists()) {
        const all: Record<string, Transaction> = snap.val();
        const list = Object.values(all)
          .filter((t) => t.userId === currentUser.uid)
          .sort((a, b) => b.timestamp - a.timestamp);
        setTransactions(list);
      } else {
        setTransactions([]);
      }
    });
    return () => unsub();
  }, [currentUser]);

  const filtered = transactions.filter((t) => {
    const matchType = filterType === 'All' || t.type === filterType;
    const matchSearch = t.description.toLowerCase().includes(search.toLowerCase()) ||
                        t.type.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-black text-white">سجل المعاملات والحركات المالية</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          سجل كامل ومفصل لكافة العمليات المالية، مكافآت المهام، السحوبات، وأرباح الإحالات.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث في سجل المعاملات..."
            className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-2xl py-2.5 pr-10 pl-4 text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['All', 'Task Reward', 'Referral Reward', 'Withdrawal', 'Bonus', 'Refund'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterType === t
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {t === 'All' ? 'جميع العمليات' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <History className="w-8 h-8 text-slate-600 mx-auto" />
            <p>لا توجد معاملات مسجلة تطابق بحثك.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-bold">
                <tr>
                  <th className="py-4 px-6">النوع</th>
                  <th className="py-4 px-6">التفاصيل</th>
                  <th className="py-4 px-6">المبلغ</th>
                  <th className="py-4 px-6">النقاط</th>
                  <th className="py-4 px-6">الحالة</th>
                  <th className="py-4 px-6">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filtered.map((tx) => (
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
                    <td className="py-4 px-6 font-medium text-slate-200">
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
                      {new Date(tx.timestamp).toLocaleString('ar-EG')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
