import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Search, 
  Filter, 
  DollarSign, 
  AlertCircle, 
  ExternalLink,
  ShieldCheck,
  Building2,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { dbRefs } from '../../lib/firebase';
import { Withdrawal, WithdrawalStatus, PlatformSettings } from '../../types';
import { onValue } from 'firebase/database';
import { updateWithdrawalStatus } from '../../lib/dbService';
import { Modal } from '../../components/Modal';
import { DEFAULT_SETTINGS } from '../../lib/constants';

export const AdminWithdrawals: React.FC = () => {
  const { userProfile: currentAdmin } = useAuth();
  const { success, error: toastError } = useToast();

  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [activeTab, setActiveTab] = useState<WithdrawalStatus | 'All'>('Pending');
  const [search, setSearch] = useState('');
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);

  // Action Modal
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'Paid' | 'Processing' | 'Rejected'>('Paid');
  const [adminNote, setAdminNote] = useState('');
  const [txHashOrRef, setTxHashOrRef] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const unsubSettings = onValue(dbRefs.settings(), (s) => s.exists() && setSettings(s.val()));
    const unsub = onValue(dbRefs.withdrawals(), (snap) => {
      if (snap.exists()) {
        const all: Record<string, Withdrawal> = snap.val();
        setWithdrawals(Object.values(all).sort((a, b) => b.createdAt - a.createdAt));
      } else {
        setWithdrawals([]);
      }
    });
    return () => {
      unsubSettings();
      unsub();
    };
  }, []);

  const openActionModal = (withdrawal: Withdrawal, type: 'Paid' | 'Processing' | 'Rejected') => {
    setSelectedWithdrawal(withdrawal);
    setActionType(type);
    setAdminNote(type === 'Paid' ? 'تم التحويل بنجاح عبر المحفظة' : type === 'Processing' ? 'جاري التحويل' : 'بيانات الدفع غير صحيحة');
    setTxHashOrRef('');
    setModalOpen(true);
  };

  const handleProcessAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdmin || !selectedWithdrawal) return;

    if (actionType === 'Rejected' && !adminNote.trim()) {
      toastError('يرجى كتابة سبب رفض طلب السحب لإبلاغ المستخدم.');
      return;
    }

    try {
      setProcessing(true);
      const res = await updateWithdrawalStatus(
        currentAdmin,
        selectedWithdrawal,
        actionType,
        adminNote.trim(),
        txHashOrRef.trim()
      );

      if (res.success) {
        success(res.message);
        setModalOpen(false);
      } else {
        toastError(res.message);
      }
    } catch (err: any) {
      toastError(err.message || 'فشلت معالجة الطلب.');
    } finally {
      setProcessing(false);
    }
  };

  const filteredWithdrawals = withdrawals.filter((w) => {
    const matchTab = activeTab === 'All' || w.status === activeTab;
    const matchSearch = 
      w.userName.toLowerCase().includes(search.toLowerCase()) ||
      w.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      w.paymentMethodName.toLowerCase().includes(search.toLowerCase()) ||
      Object.values(w.paymentDetails || {}).some((v) => v.toLowerCase().includes(search.toLowerCase()));
    return matchTab && matchSearch;
  });

  const pendingCount = withdrawals.filter((w) => w.status === 'Pending').length;
  const processingCount = withdrawals.filter((w) => w.status === 'Processing').length;
  const paidCount = withdrawals.filter((w) => w.status === 'Paid').length;
  const rejectedCount = withdrawals.filter((w) => w.status === 'Rejected').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">إدارة طلبات السحب والمدفوعات</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            مراجعة وتحويل طلبات سحب الأرباح للأعضاء وإرسال إشعارات فورية بالحالة.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-amber-400 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            {pendingCount} طلبات معلقة
          </span>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم المستخدم، الإيميل أو رقم المحفظة..."
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-2.5 pr-10 pl-4 text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {[
              { label: 'بانتظار المراجعة (Pending)', value: 'Pending', count: pendingCount, color: 'text-amber-400' },
              { label: 'قيد المعالجة (Processing)', value: 'Processing', count: processingCount, color: 'text-blue-400' },
              { label: 'تم الدفع (Paid)', value: 'Paid', count: paidCount, color: 'text-emerald-400' },
              { label: 'المرفوضة (Rejected)', value: 'Rejected', count: rejectedCount, color: 'text-rose-400' },
              { label: 'جميع الطلبات', value: 'All', count: withdrawals.length, color: 'text-slate-300' }
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeTab === tab.value
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/60 font-mono">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* WITHDRAWALS TABLE */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-bold">
              <tr>
                <th className="py-4 px-6">المستخدم</th>
                <th className="py-4 px-6">طريقة الدفع</th>
                <th className="py-4 px-6">بيانات الاستلام</th>
                <th className="py-4 px-6">المبلغ والصافي</th>
                <th className="py-4 px-6">الحالة</th>
                <th className="py-4 px-6">تاريخ الطلب</th>
                <th className="py-4 px-6 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    لا توجد طلبات سحب في هذا القسم.
                  </td>
                </tr>
              ) : (
                filteredWithdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-100">{w.userName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{w.userEmail}</div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 font-bold text-[11px]">
                        {w.paymentMethodName}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <div className="space-y-0.5 font-mono text-[11px] text-slate-200 bg-slate-950/60 p-2 rounded-xl border border-slate-800 max-w-xs">
                        {Object.entries(w.paymentDetails || {}).map(([k, val]) => (
                          <div key={k} className="truncate">
                            <span className="text-slate-400 font-sans text-[10px]">{k}:</span> {val}
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="py-4 px-6 font-mono">
                      <div className="text-sm font-black text-white">{w.amount.toFixed(2)} {settings.currencySymbol || 'ج.م'}</div>
                      <div className="text-[10px] text-emerald-400">صافي: {w.netAmount.toFixed(2)} {settings.currencySymbol || 'ج.م'}</div>
                    </td>

                    <td className="py-4 px-6">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        w.status === 'Paid'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : w.status === 'Processing'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : w.status === 'Pending'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {w.status === 'Paid' ? 'تم الدفع' : w.status === 'Processing' ? 'قيد المعالجة' : w.status === 'Pending' ? 'معلق' : 'مرفوض'}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(w.createdAt).toLocaleString('ar-EG', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-1.5">
                        {w.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => openActionModal(w, 'Paid')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors"
                            >
                              دفع وموافقة
                            </button>
                            <button
                              onClick={() => openActionModal(w, 'Processing')}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] transition-colors"
                            >
                              معالجة
                            </button>
                            <button
                              onClick={() => openActionModal(w, 'Rejected')}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition-colors"
                            >
                              رفض وإرجاع
                            </button>
                          </>
                        )}
                        {w.status === 'Processing' && (
                          <>
                            <button
                              onClick={() => openActionModal(w, 'Paid')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors"
                            >
                              تأكيد الدفع
                            </button>
                            <button
                              onClick={() => openActionModal(w, 'Rejected')}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition-colors"
                            >
                              إلغاء ورفض
                            </button>
                          </>
                        )}
                        {(w.status === 'Paid' || w.status === 'Rejected') && (
                          <span className="text-[10px] text-slate-500 font-medium">مكتمل المعالجة</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PROCESS ACTION MODAL */}
      {modalOpen && selectedWithdrawal && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={`معالجة طلب السحب #${selectedWithdrawal.id}`}
          maxWidth="md"
        >
          <form onSubmit={handleProcessAction} className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">المستخدم:</span>
                <span className="font-bold text-white">{selectedWithdrawal.userName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">طريقة السحب:</span>
                <span className="font-bold text-emerald-400">{selectedWithdrawal.paymentMethodName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">المبلغ الإجمالي:</span>
                <span className="font-mono font-bold text-white">{selectedWithdrawal.amount.toFixed(2)} {settings.currencySymbol || 'ج.م'}</span>
              </div>
              <div className="flex items-center justify-between font-bold">
                <span className="text-slate-400">الصافي المطلوب تحويله:</span>
                <span className="font-mono text-emerald-400 text-sm">{selectedWithdrawal.netAmount.toFixed(2)} {settings.currencySymbol || 'ج.م'}</span>
              </div>
            </div>

            {/* Payment Details Box */}
            <div className="space-y-1">
              <label className="font-bold text-slate-300">بيانات الاستلام للتحويل إليها:</label>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 font-mono text-slate-200">
                {Object.entries(selectedWithdrawal.paymentDetails || {}).map(([k, val]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-slate-400 font-sans">{k}:</span>
                    <span className="select-all font-bold text-emerald-400">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Transaction Hash / Ref if Paid */}
            {actionType === 'Paid' && (
              <div className="space-y-1">
                <label className="font-bold text-slate-300">رقم المعاملة أو مرجع التحويل (Reference / TxID)</label>
                <input
                  type="text"
                  dir="ltr"
                  value={txHashOrRef}
                  onChange={(e) => setTxHashOrRef(e.target.value)}
                  placeholder="مثال: VF92847291 أو InstaPay Ref ID"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-100 outline-none font-mono"
                />
              </div>
            )}

            {/* Admin Note */}
            <div className="space-y-1">
              <label className="font-bold text-slate-300">
                {actionType === 'Rejected' ? 'سبب الرفض (إلزامي لإبلاغ المستخدم واسترجاع الرصيد) *' : 'ملاحظة الأدمن'}
              </label>
              <textarea
                rows={2}
                required={actionType === 'Rejected'}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="اكتب ملاحظتك هنا..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-100 outline-none resize-none"
              />
            </div>

            {actionType === 'Rejected' && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] leading-relaxed">
                ⚠️ عند الرفض، سيتم استرجاع مبلغ {selectedWithdrawal.amount.toFixed(2)} {settings.currencySymbol || 'ج.م'} تلقائياً إلى محفظة المستخدم مع إرسال إشعار فوري بالسبب.
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={processing}
                className={`px-5 py-2 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2 ${
                  actionType === 'Paid'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950'
                    : actionType === 'Processing'
                    ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-950'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-950'
                }`}
              >
                {processing && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                <span>
                  {actionType === 'Paid' ? 'تأكيد إتمام الدفع' : actionType === 'Processing' ? 'تحديث إلى قيد المعالجة' : 'رفض واسترجاع الرصيد'}
                </span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
