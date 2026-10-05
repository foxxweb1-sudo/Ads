import React, { useState, useEffect } from 'react';
import { Sliders, Save, Shield, Coins, AlertTriangle, HelpCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { dbRefs } from '../../lib/firebase';
import { PlatformSettings } from '../../types';
import { onValue, set } from 'firebase/database';
import { logActivity } from '../../lib/dbService';
import { DEFAULT_SETTINGS } from '../../lib/constants';

export const AdminSettings: React.FC = () => {
  const { userProfile: currentAdmin } = useAuth();
  const { success, error: toastError } = useToast();

  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onValue(dbRefs.settings(), (snap) => {
      if (snap.exists()) {
        setSettings(snap.val());
      }
    });
    return () => unsub();
  }, []);

  const handleChange = (key: keyof PlatformSettings, val: any) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdmin) return;

    try {
      setSaving(true);
      await set(dbRefs.settings(), settings);
      await logActivity({
        actorId: currentAdmin.uid,
        actorEmail: currentAdmin.email,
        action: 'Settings Updated',
        description: 'قام الأدمن بتحديث الإعدادات العامة واقتصاد المنصة'
      });
      success('تم حفظ إعدادات المنصة بنجاح.');
    } catch (err: any) {
      toastError('فشل حفظ الإعدادات.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">إعدادات المنصة واقتصاد النقاط</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            التحكم في سعر تحويل النقاط، الحدود المالية، ونمط التشغيل العام.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950 transition-all flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'جارِ الحفظ...' : 'حفظ التعديلات'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Economy Configuration */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-400 border-b border-slate-800 pb-3">
            <Coins className="w-5 h-5" />
            <span>اقتصاد النقاط وأسعار التحويل</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">
                معدل تحويل النقاط (كم نقطة تعادل 1.00 {settings.currencySymbol || 'ج.م'})
              </label>
              <input
                type="number"
                min="10"
                step="10"
                required
                value={settings.pointsPerCurrencyUnit}
                onChange={(e) => handleChange('pointsPerCurrencyUnit', parseInt(e.target.value) || 100)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-emerald-400 font-bold font-mono outline-none"
              />
              <p className="text-[10px] text-slate-400">
                مثال: 100 نقطة = 1 جنيه مصري (أي 1000 نقطة = 10 جنيهات).
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">النسبة الافتراضية لعمولة الإحالة (%)</label>
              <input
                type="number"
                min="1"
                max="50"
                required
                value={settings.defaultReferralPercentage}
                onChange={(e) => handleChange('defaultReferralPercentage', parseInt(e.target.value) || 5)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-cyan-400 font-bold font-mono outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">الحد الأدنى العام للسحب ({settings.currencySymbol || 'ج.م'})</label>
              <input
                type="number"
                min="1"
                required
                value={settings.minWithdrawal}
                onChange={(e) => handleChange('minWithdrawal', parseFloat(e.target.value) || 50)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-100 font-mono outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">الحد الأقصى للسحب في المرة الواحدة ({settings.currencySymbol || 'ج.م'})</label>
              <input
                type="number"
                min="100"
                required
                value={settings.maxWithdrawal}
                onChange={(e) => handleChange('maxWithdrawal', parseFloat(e.target.value) || 10000)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-100 font-mono outline-none"
              />
            </div>
          </div>
        </div>

        {/* General Brand Settings */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800 pb-3">
            <Sliders className="w-5 h-5 text-amber-400" />
            <span>بيانات المنصة وهوية الموقع</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">اسم المنصة (Site Name)</label>
              <input
                type="text"
                required
                value={settings.siteName}
                onChange={(e) => handleChange('siteName', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-100 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">رمز العملة (Currency Code)</label>
              <input
                type="text"
                required
                value={settings.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-100 font-mono outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">رمز العرض بالعربية (Symbol)</label>
              <input
                type="text"
                required
                value={settings.currencySymbol}
                onChange={(e) => handleChange('currencySymbol', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-100 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">بريد الدعم الفني (Support Email)</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => handleChange('supportEmail', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-100 outline-none font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">قناة / حساب تليجرام</label>
              <input
                type="text"
                value={settings.supportTelegram || ''}
                onChange={(e) => handleChange('supportTelegram', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-100 outline-none font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-300">تنبيه الشروط والأمان (يظهر في أسفل المنصة)</label>
            <textarea
              rows={2}
              value={settings.termsNotice || ''}
              onChange={(e) => handleChange('termsNotice', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-100 outline-none resize-none"
            />
          </div>
        </div>

        {/* System Toggles */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="font-bold text-sm text-white border-b border-slate-800 pb-3">حالة التشغيل والأمان</div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
              <div>
                <div className="font-bold text-slate-200">إتاحة تسجيل مستخدمين جدد (Registration Enabled)</div>
                <div className="text-[11px] text-slate-400">عند التعطيل لن يتمكن أي زائر جديد من إنشاء حساب.</div>
              </div>
              <input
                type="checkbox"
                checked={settings.registrationEnabled}
                onChange={(e) => handleChange('registrationEnabled', e.target.checked)}
                className="w-5 h-5 rounded border-slate-800 text-emerald-600 focus:ring-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
              <div>
                <div className="font-bold text-rose-400">وضع الصيانة (Maintenance Mode)</div>
                <div className="text-[11px] text-slate-400">إيقاف المنصة مؤقتاً وعرض صفحة الصيانة للمستخدمين العاديين.</div>
              </div>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                className="w-5 h-5 rounded border-slate-800 text-rose-600 focus:ring-rose-500"
              />
            </label>
          </div>
        </div>
      </form>
    </div>
  );
};
