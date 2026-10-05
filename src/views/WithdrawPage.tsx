import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  Wallet, 
  CreditCard, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  HelpCircle,
  Smartphone,
  Zap,
  Building2,
  Coins
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { dbRefs } from '../lib/firebase';
import { PaymentMethod, Withdrawal, PlatformSettings } from '../types';
import { onValue } from 'firebase/database';
import { requestWithdrawal } from '../lib/dbService';
import { ConfirmModal } from '../components/Modal';
import { DEFAULT_PAYMENT_METHODS, DEFAULT_SETTINGS } from '../lib/constants';

interface WithdrawPageProps {
  onNavigate: (path: string) => void;
}

export const WithdrawPage: React.FC<WithdrawPageProps> = ({ onNavigate }) => {
  const { userProfile } = useAuth();
  const { success, error: toastError } = useToast();

  const [paymentMethods, setPaymentMethods] = useState<Record<string, PaymentMethod>>(DEFAULT_PAYMENT_METHODS);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('vodafone_cash');
  const [amount, setAmount] = useState<string>('50');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [userWithdrawals, setUserWithdrawals] = useState<Withdrawal[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Sync settings and payment methods
  useEffect(() => {
    const unsubSettings = onValue(dbRefs.settings(), (snap) => {
      if (snap.exists()) setSettings(snap.val());
    });
    const unsubPM = onValue(dbRefs.paymentMethods(), (snap) => {
      if (snap.exists()) setPaymentMethods(snap.val());
    });
    return () => {
      unsubSettings();
      unsubPM();
    };
  }, []);

  // Sync user withdrawals
  useEffect(() => {
    if (!userProfile) return;
    const unsub = onValue(dbRefs.withdrawals(), (snap) => {
      if (snap.exists()) {
        const all: Record<string, Withdrawal> = snap.val();
        const userWds = Object.values(all)
          .filter((w) => w.userId === userProfile.uid)
          .sort((a, b) => b.createdAt - a.createdAt);
        setUserWithdrawals(userWds);
      } else {
        setUserWithdrawals([]);
      }
    });
    return () => unsub();
  }, [userProfile]);

  const activeMethods = Object.values(paymentMethods).filter((m) => m.status === 'active');
  const selectedMethod = paymentMethods[selectedMethodId] || activeMethods[0];

  const parsedAmount = parseFloat(amount) || 0;
  const minAmount = Math.max(selectedMethod?.minimumAmount || 50, settings.minWithdrawal || 50);
  const maxAmount = Math.min(selectedMethod?.maximumAmount || 10000, settings.maxWithdrawal || 10000);
  const fee = Number(((parsedAmount * (selectedMethod?.feePercentage || 0)) / 100).toFixed(2));
  const netPayout = Math.max(0, Number((parsedAmount - fee).toFixed(2)));

  const handleFieldChange = (key: string, val: string) => {
    setFieldValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    if (parsedAmount <= 0) {
      toastError('يرجى إدخال مبلغ سحب صحيح.');
      return;
    }

    if (parsedAmount < minAmount) {
      toastError(`الحد الأدنى للسحب عبر ${selectedMethod.nameAr} هو ${minAmount} ${settings.currencySymbol || 'ج.م'}.`);
      return;
    }

    if (parsedAmount > maxAmount) {
      toastError(`الحد الأقصى للسحب هو ${maxAmount} ${settings.currencySymbol || 'ج.م'}.`);
      return;
    }

    if (userProfile.balance < parsedAmount) {
      toastError('رصيدك المتاح غير كافٍ لإتمام طلب هذا السحب.');
      return;
    }

    // Validate fields
    for (const field of selectedMethod.fields) {
      if (field.required && (!fieldValues[field.key] || !fieldValues[field.key].trim())) {
        toastError(`يرجى كتابة "${field.labelAr}".`);
        return;
      }
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (!userProfile || !selectedMethod) return;

    try {
      setSubmitting(true);
      const res = await requestWithdrawal(
        userProfile,
        parsedAmount,
        selectedMethod,
        fieldValues,
        settings
      );

      if (res.success) {
        success(res.message);
        setShowConfirmModal(false);
        setFieldValues({});
        setAmount(minAmount.toString());
      } else {
        toastError(res.message);
      }
    } catch (err: any) {
      toastError(err.message || 'فشلت معالجة طلب السحب.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">طلب سحب الأرباح</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            اختر وسيلة الدفع المناسبة وأدخل بيانات الاستلام لمعالجة طلبك خلال ساعات.
          </p>
        </div>

        {/* Available Balance Box */}
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-4 shrink-0">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400">الرصيد القابل للسحب</div>
            <div className="text-xl font-black text-emerald-400">
              {(userProfile?.balance || 0).toFixed(2)} {settings.currencySymbol || 'ج.م'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleOpenConfirm} className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
            {/* Payment Method Selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300">1. اختر طريقة السحب:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {activeMethods.map((method) => {
                  const isSelected = selectedMethodId === method.id;
                  return (
                    <div
                      key={method.id}
                      onClick={() => setSelectedMethodId(method.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                        isSelected
                          ? 'bg-emerald-950/30 border-emerald-500 shadow-md shadow-emerald-950/30'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">{method.nameAr}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        الحد الأدنى: <strong className="text-slate-200">{method.minimumAmount} {settings.currencySymbol || 'ج.م'}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Instructions */}
            {selectedMethod?.instructionsAr && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                ℹ️ {selectedMethod.instructionsAr}
              </div>
            )}

            {/* Amount Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">2. المبلغ المراد سحبه:</label>
                <button
                  type="button"
                  onClick={() => setAmount((userProfile?.balance || 0).toString())}
                  className="text-[11px] text-emerald-400 hover:underline font-bold"
                >
                  سحب كامل الرصيد ({(userProfile?.balance || 0).toFixed(2)} {settings.currencySymbol || 'ج.م'})
                </button>
              </div>

              <div className="relative">
                <input
                  type="number"
                  min={minAmount}
                  max={maxAmount}
                  step="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-3 px-4 text-base font-bold text-emerald-400 outline-none"
                />
                <span className="absolute left-4 top-3.5 text-xs text-slate-400 font-bold">
                  {settings.currencySymbol || 'ج.م'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                الحد الأدنى: {minAmount} {settings.currencySymbol || 'ج.م'} - الحد الأقصى: {maxAmount} {settings.currencySymbol || 'ج.م'}
              </p>
            </div>

            {/* Dynamic Custom Fields */}
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <label className="text-xs font-bold text-slate-300">3. بيانات استلام الدفعة:</label>

              {selectedMethod?.fields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <label className="text-xs text-slate-400 flex items-center justify-between">
                    <span>{field.labelAr} {field.required && <span className="text-rose-400">*</span>}</span>
                  </label>
                  <input
                    type={field.type}
                    required={field.required}
                    value={fieldValues[field.key] || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    placeholder={field.placeholderAr}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 outline-none"
                  />
                </div>
              ))}
            </div>

            {/* Calculation Summary */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>المبلغ المطلوب:</span>
                <span className="font-bold text-slate-200">{parsedAmount.toFixed(2)} {settings.currencySymbol || 'ج.م'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>رسوم التحويل ({selectedMethod?.feePercentage || 0}%):</span>
                <span className="text-slate-200">{fee.toFixed(2)} {settings.currencySymbol || 'ج.م'}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                <span>المبلغ الصافي المستلم:</span>
                <span className="text-emerald-400 text-base font-black">{netPayout.toFixed(2)} {settings.currencySymbol || 'ج.م'}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || (userProfile?.balance || 0) < parsedAmount || parsedAmount < minAmount}
              className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 ${
                (userProfile?.balance || 0) >= parsedAmount && parsedAmount >= minAmount
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 hover:scale-[1.01]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <ArrowUpRight className="w-5 h-5" />
              <span>متابعة وتأكيد طلب السحب</span>
            </button>
          </form>
        </div>

        {/* User Withdrawals History & FAQ (1 col) */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>طلبات السحب الخاصة بك ({userWithdrawals.length})</span>
            </h3>

            {userWithdrawals.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                لم تقم بإنشاء أي طلبات سحب حتى الآن.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {userWithdrawals.map((w) => (
                  <div key={w.id} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{w.paymentMethodName}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        w.status === 'Paid'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : w.status === 'Processing'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : w.status === 'Pending'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {w.status === 'Paid' ? 'تم الدفع بنجاح' : w.status === 'Processing' ? 'قيد المعالجة' : w.status === 'Pending' ? 'معلق' : 'مرفوض'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>المبلغ: <strong className="text-white font-mono">{w.amount.toFixed(2)} {settings.currencySymbol || 'ج.م'}</strong></span>
                      <span>{new Date(w.createdAt).toLocaleDateString('ar-EG')}</span>
                    </div>

                    {w.adminNote && (
                      <p className="text-[10px] text-slate-400 bg-slate-900 p-2 rounded-lg border border-slate-800">
                        ملاحظة الإدارة: {w.adminNote}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 text-xs text-slate-400">
            <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>شروط وملاحظات السحب</span>
            </h4>
            <ul className="space-y-1.5 list-disc list-inside leading-relaxed text-[11px]">
              <li>تتم معالجة الطلبات يومياً من 10 صباحاً حتى 10 مساءً.</li>
              <li>يرجى التأكد من كتابة رقم المحفظة / الحساب بدقة تامة.</li>
              <li>في حال رفض الطلب لأي سبب، يتم إرجاع المبلغ تلقائياً لمحفظتك.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSubmit}
        title="تأكيد إرسال طلب السحب"
        message={`هل أنت متأكد من رغبتك في سحب مبلغ ${parsedAmount} ${settings.currencySymbol || 'ج.م'} عبر ${selectedMethod?.nameAr}؟ سيتم خصم المبلغ من رصيدك وإرساله للمراجعة والتحويل.`}
        confirmText="تأكيد وإرسال الطلب"
        cancelText="تراجع"
        loading={submitting}
      />
    </div>
  );
};
