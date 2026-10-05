import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Laptop, Smartphone, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';
import { dbRefs } from '../../lib/firebase';
import { LoginLog } from '../../types';
import { onValue } from 'firebase/database';

export const AdminLoginLogs: React.FC = () => {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const unsub = onValue(dbRefs.loginLogs(), (snap) => {
      if (snap.exists()) {
        const all: Record<string, LoginLog> = snap.val();
        setLogs(Object.values(all).sort((a, b) => b.timestamp - a.timestamp));
      } else {
        setLogs([]);
      }
    });
    return () => unsub();
  }, []);

  const filtered = logs.filter((l) => {
    const matchStatus = statusFilter === 'All' || l.status === statusFilter;
    const matchSearch = 
      (l.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.device || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.ip || '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-black text-white">سجلات الدخول والأمان (Security & Login Logs)</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          مراقبة وتتبع عمليات تسجيل الدخول، الأجهزة، المتصفحات، وعناوين الـ IP لرصد أي اختراق أو حسابات مكررة.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالبريد الإلكتروني، الجهاز، أو الـ IP..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-2.5 pr-10 pl-4 text-xs sm:text-sm text-slate-100 outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-2xl py-2.5 px-3 text-xs text-slate-200 outline-none w-full sm:w-auto"
        >
          <option value="All">جميع الأحداث</option>
          <option value="Successful Login">دخول ناجح (Successful Login)</option>
          <option value="Failed Login">محاولة فاشلة (Failed Login)</option>
          <option value="Logout">تسجيل خروج (Logout)</option>
          <option value="Password Reset">استعادة كلمة المرور</option>
        </select>
      </div>

      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-bold">
              <tr>
                <th className="py-4 px-6">المستخدم / الإيميل</th>
                <th className="py-4 px-6">حالة الدخول</th>
                <th className="py-4 px-6">الجهاز ونظام التشغيل</th>
                <th className="py-4 px-6">المتصفح</th>
                <th className="py-4 px-6">عنوان الـ IP</th>
                <th className="py-4 px-6">التاريخ والوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                    لا توجد سجلات مطابقة للبحث.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-100 font-mono">
                      {log.email}
                    </td>

                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 w-max ${
                        log.status === 'Successful Login'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : log.status === 'Failed Login'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {log.status === 'Successful Login' && <CheckCircle2 className="w-3 h-3" />}
                        {log.status === 'Failed Login' && <AlertCircle className="w-3 h-3" />}
                        {log.status === 'Logout' && <LogOut className="w-3 h-3" />}
                        <span>{log.status}</span>
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-200">{log.device || 'Desktop'}</div>
                      <div className="text-[10px] text-slate-400">{log.os}</div>
                    </td>

                    <td className="py-4 px-6 text-slate-300">
                      {log.browser}
                    </td>

                    <td className="py-4 px-6 font-mono text-[11px] text-amber-400">
                      {log.ip || '127.0.0.1'}
                    </td>

                    <td className="py-4 px-6 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('ar-EG')}
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
