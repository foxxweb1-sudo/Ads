import React, { useState, useEffect } from 'react';
import { Sparkles, Save, Shield, Award, Crown, Gem } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { dbRefs } from '../../lib/firebase';
import { LevelConfig } from '../../types';
import { onValue, set } from 'firebase/database';
import { logActivity } from '../../lib/dbService';
import { DEFAULT_LEVELS } from '../../lib/constants';

export const AdminLevels: React.FC = () => {
  const { userProfile: currentAdmin } = useAuth();
  const { success, error: toastError } = useToast();

  const [levels, setLevels] = useState<Record<string, LevelConfig>>(DEFAULT_LEVELS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onValue(dbRefs.levels(), (snap) => {
      if (snap.exists()) {
        setLevels(snap.val());
      }
    });
    return () => unsub();
  }, []);

  const handleLevelChange = (levelId: string, key: keyof LevelConfig, val: any) => {
    setLevels((prev) => ({
      ...prev,
      [levelId]: {
        ...prev[levelId],
        [key]: val
      }
    }));
  };

  const handleSaveAll = async () => {
    if (!currentAdmin) return;
    try {
      setSaving(true);
      await set(dbRefs.levels(), levels);
      await logActivity({
        actorId: currentAdmin.uid,
        actorEmail: currentAdmin.email,
        action: 'Levels Config Updated',
        description: 'قام الأدمن بتحديث إعدادات مستويات الحسابات والمضاعفات'
      });
      success('تم حفظ إعدادات المستويات بنجاح!');
    } catch (err: any) {
      toastError('فشل حفظ الإعدادات.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">إدارة نظام المستويات والترقيات</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            تخصيص النقاط المطلوبة لكل رتبة، مضاعف أرباح المهام (Multiplier)، ونسب عمولة الإحالة.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950 transition-all flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'جارِ الحفظ...' : 'حفظ جميع التعديلات'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(levels).map(([id, lvl]) => (
          <div key={id} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${lvl.badgeColor}`}>
                {lvl.nameAr} ({lvl.name})
              </span>
              <Sparkles className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400">النقاط المطلوبة للترقية</label>
                <input
                  type="number"
                  value={lvl.minPoints}
                  onChange={(e) => handleLevelChange(id, 'minPoints', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-100 font-mono outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">مضاعف أرباح المهام (Task Multiplier)</label>
                <input
                  type="number"
                  step="0.05"
                  value={lvl.taskMultiplier}
                  onChange={(e) => handleLevelChange(id, 'taskMultiplier', parseFloat(e.target.value) || 1.0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-emerald-400 font-bold font-mono outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">نسبة عمولة الإحالة (%)</label>
                <input
                  type="number"
                  value={lvl.referralPercentage}
                  onChange={(e) => handleLevelChange(id, 'referralPercentage', parseInt(e.target.value) || 5)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-cyan-400 font-bold font-mono outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">الحد اليومي للمهام</label>
                <input
                  type="number"
                  value={lvl.dailyTaskLimit}
                  onChange={(e) => handleLevelChange(id, 'dailyTaskLimit', parseInt(e.target.value) || 10)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-100 font-mono outline-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
