import React, { useState, useEffect } from 'react';
import { Activity, Search, Shield, CheckCircle2, ArrowUpRight, UserPlus, Sliders } from 'lucide-react';
import { dbRefs } from '../../lib/firebase';
import { ActivityLog } from '../../types';
import { onValue } from 'firebase/database';

export const AdminActivity: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsub = onValue(dbRefs.activityLogs(), (snap) => {
      if (snap.exists()) {
        const all: Record<string, ActivityLog> = snap.val();
        setLogs(Object.values(all).sort((a, b) => b.timestamp - a.timestamp));
      } else {
        setLogs([]);
      }
    });
    return () => unsub();
  }, []);

  const filtered = logs.filter((l) => {
    return (
      (l.actorEmail || '').toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.description.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-black text-white">سجل الأنشطة الحي (Audit & Activity Trail)</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          بث حي وفوري لجميع إجراءات المستخدمين والأدمن في المنصة.
        </p>
      </div>

      <div className="relative w-full">
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث في سجل الأنشطة..."
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-2.5 pr-10 pl-4 text-xs sm:text-sm text-slate-100 outline-none"
        />
      </div>

      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-bold">
              <tr>
                <th className="py-4 px-6">المُنفّذ (Actor)</th>
                <th className="py-4 px-6">نوع النشاط (Action)</th>
                <th className="py-4 px-6">التفاصيل</th>
                <th className="py-4 px-6">الوقت والتاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-xs text-slate-400">
                    لا توجد أنشطة مسجلة حالياً.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-200 font-mono">
                      {log.actorEmail || log.actorId}
                    </td>

                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 text-emerald-400 border border-emerald-500/20">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-4 px-6 font-medium text-slate-100">
                      {log.description}
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
