import React, { useState, useEffect } from 'react';
import { CreditCard, Save, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { dbRefs } from '../../lib/firebase';
import { PaymentMethod } from '../../types';
import { onValue, set } from 'firebase/database';
import { logActivity } from '../../lib/dbService';
import { DEFAULT_PAYMENT_METHODS } from '../../lib/constants';

export const AdminPaymentMethods: React.FC = () => {
  const { userProfile: currentAdmin } = useAuth();
  const { success, error: toastError } = useToast();

  const [methods, setMethods] = useState<Record<string, PaymentMethod>>(DEFAULT_PAYMENT_METHODS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onValue(dbRefs.paymentMethods(), (snap) => {
      if (snap.exists()) {
        setMethods(snap.val());
      }
    });
    return () => unsub();
  }, []);

  const handleToggleStatus = (id: string) => {
    setMethods((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        status: prev[id].status === 'active' ? 'inactive' : 'active'
      }
    }));
  };

  const handleUpdateField = (id: string, key: keyof PaymentMethod, val: any) => {
    setMethods((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [key]: val
      }
    }));
  };

  const handleSaveAll = async () => {
    if (!currentAdmin) return;
    try {
      setSaving(true);
      await set(dbRefs.paymentMethods(), methods);
      await logActivity({
        actorId: currentAdmin.uid,
        actorEmail: currentAdmin.email,
        action: 'Payment Methods Updated',
        description: 'قام الأدمن بتحديث بوابات السحب والحدود والرسوم'
      });
      success('تم حفظ إعدادات طرق الدفع بنجاح!');
    } catch (err: any) {
      toastError('فشل حفظ التعديلات.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">إدارة بوابات وطرق السحب</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            تفعيل أو تعطيل وسائل السحب، تعديل الحدود الدنيا والقصوى، وتحديد الرسوم وتعليمات الاستلام.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950 transition-all flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'جارِ الحفظ...' : 'حفظ التعديلات'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(methods).map(([id, m]) => (
          <div
            key={id}
            className={`p-6 rounded-3xl bg-slate-900 border transition-all space-y-4 ${
              m.status === 'active' ? 'border-slate-800' : 'border-slate-800/60 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-sm text-white">{m.nameAr}</span>
              <button
                type="button"
                onClick={() => handleToggleStatus(id)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                  m.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {m.status === 'active' ? '🟢 نشطة ومتاحة' : '⚪ معطلة'}
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-400">الحد الأدنى للسحب</label>
                  <input
                    type="number"
                    value={m.minimumAmount}
                    onChange={(e) => handleUpdateField(id, 'minimumAmount', parseFloat(e.target.value) || 50)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-100 font-mono outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">نسبة الرسوم (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={m.feePercentage}
                    onChange={(e) => handleUpdateField(id, 'feePercentage', parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-100 font-mono outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">تعليمات للمستخدم عند السحب</label>
                <textarea
                  rows={2}
                  value={m.instructionsAr || ''}
                  onChange={(e) => handleUpdateField(id, 'instructionsAr', e.target.value)}
                  placeholder="تعليمات الدفع..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-100 outline-none resize-none"
                />
              </div>

              {/* Fields preview */}
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                <span className="font-bold text-slate-300">الحقول المطلوبة: </span>
                {m.fields.map((f) => f.labelAr).join(' • ')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
