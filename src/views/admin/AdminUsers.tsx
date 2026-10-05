import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Shield, 
  ShieldAlert, 
  Ban, 
  CheckCircle2, 
  Edit3, 
  DollarSign, 
  Eye, 
  Sparkles, 
  AlertTriangle,
  Gift,
  Coins,
  Wallet,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { dbRefs } from '../../lib/firebase';
import { UserProfile, UserRole, UserLevelId, AccountStatus, PlatformSettings } from '../../types';
import { onValue, update } from 'firebase/database';
import { adjustUserFinancials, logActivity } from '../../lib/dbService';
import { Modal, ConfirmModal } from '../../components/Modal';
import { DEFAULT_SETTINGS } from '../../lib/constants';

export const AdminUsers: React.FC = () => {
  const { userProfile: currentAdmin } = useAuth();
  const { success, error: toastError } = useToast();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);

  // Modals state
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  
  // Adjust Financials Modal state
  const [financialModalOpen, setFinancialModalOpen] = useState(false);
  const [amountChange, setAmountChange] = useState<string>('0');
  const [pointsChange, setPointsChange] = useState<string>('0');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjustType, setAdjustType] = useState<'Adjustment' | 'Bonus'>('Bonus');
  const [adjustLoading, setAdjustLoading] = useState(false);

  // Edit Role & Level Modal
  const [roleLevelModalOpen, setRoleLevelModalOpen] = useState(false);
  const [editRole, setEditRole] = useState<UserRole>('user');
  const [editLevel, setEditLevel] = useState<UserLevelId>('Bronze');
  const [editStatus, setEditStatus] = useState<AccountStatus>('active');
  const [roleLevelLoading, setRoleLevelLoading] = useState(false);

  useEffect(() => {
    const unsubSettings = onValue(dbRefs.settings(), (snap) => snap.exists() && setSettings(snap.val()));
    const unsubUsers = onValue(dbRefs.users(), (snap) => {
      if (snap.exists()) {
        const all: Record<string, UserProfile> = snap.val();
        setUsers(Object.values(all).sort((a, b) => b.createdAt - a.createdAt));
      } else {
        setUsers([]);
      }
    });
    return () => {
      unsubSettings();
      unsubUsers();
    };
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchSearch = 
      (u.displayName || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.referralCode || '').toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'All' || u.role === roleFilter;
    const matchStatus = statusFilter === 'All' || u.accountStatus === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const handleOpenFinancials = (user: UserProfile) => {
    setSelectedUser(user);
    setAmountChange('10');
    setPointsChange('1000');
    setAdjustReason('مكافأة تشجيعية لنشاط الحساب');
    setAdjustType('Bonus');
    setFinancialModalOpen(true);
  };

  const handleSaveFinancials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdmin || !selectedUser) return;
    const numAmount = parseFloat(amountChange) || 0;
    const numPoints = parseInt(pointsChange) || 0;

    if (!adjustReason.trim()) {
      toastError('يرجى كتابة سبب التعديل المالي في سجل التدقيق.');
      return;
    }

    try {
      setAdjustLoading(true);
      const res = await adjustUserFinancials(
        currentAdmin,
        selectedUser.uid,
        numAmount,
        numPoints,
        adjustReason.trim(),
        adjustType
      );

      if (res.success) {
        success(res.message);
        setFinancialModalOpen(false);
      } else {
        toastError(res.message);
      }
    } catch (err: any) {
      toastError(err.message || 'فشلت العملية.');
    } finally {
      setAdjustLoading(false);
    }
  };

  const handleOpenRoleLevel = (user: UserProfile) => {
    setSelectedUser(user);
    setEditRole(user.role || 'user');
    setEditLevel(user.level || 'Bronze');
    setEditStatus(user.accountStatus || 'active');
    setRoleLevelModalOpen(true);
  };

  const handleSaveRoleLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdmin || !selectedUser) return;

    try {
      setRoleLevelLoading(true);
      const userRef = dbRefs.user(selectedUser.uid);
      await update(userRef, {
        role: editRole,
        level: editLevel,
        accountStatus: editStatus
      });

      await logActivity({
        actorId: currentAdmin.uid,
        actorEmail: currentAdmin.email,
        targetUserId: selectedUser.uid,
        action: 'User Role/Status Update',
        description: `تحديث حساب المستخدم (${selectedUser.username}): Role: ${editRole}, Level: ${editLevel}, Status: ${editStatus}`
      });

      success('تم تحديث صلاحيات وحالة المستخدم بنجاح.');
      setRoleLevelModalOpen(false);
    } catch (err: any) {
      toastError(err.message || 'فشل التحديث.');
    } finally {
      setRoleLevelLoading(false);
    }
  };

  const handleToggleBan = async (user: UserProfile) => {
    if (!currentAdmin) return;
    const nextStatus: AccountStatus = user.accountStatus === 'banned' ? 'active' : 'banned';
    try {
      await update(dbRefs.user(user.uid), { accountStatus: nextStatus });
      await logActivity({
        actorId: currentAdmin.uid,
        actorEmail: currentAdmin.email,
        targetUserId: user.uid,
        action: nextStatus === 'banned' ? 'Account Banned' : 'Account Activated',
        description: `قام الأدمن بـ ${nextStatus === 'banned' ? 'حظر' : 'تفعيل'} حساب (${user.username})`
      });
      success(`تم ${nextStatus === 'banned' ? 'حظر' : 'تفعيل'} الحساب بنجاح.`);
    } catch (err: any) {
      toastError('فشلت العملية.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">إدارة المستخدمين والأعضاء</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            مراقبة الحسابات، تعديل الأرصدة والبونص، إدارة الصلاحيات، وحظر الحسابات المشبوهة.
          </p>
        </div>
        <div className="text-xs font-bold text-slate-400 px-4 py-2 rounded-2xl bg-slate-950 border border-slate-800">
          إجمالي المسجلين: <strong className="text-emerald-400 font-mono text-sm">{users.length}</strong>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم، الإيميل، اسم المستخدم أو كود الإحالة..."
            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-2xl py-2.5 pr-10 pl-4 text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-2xl py-2.5 px-3 text-xs text-slate-200 outline-none"
          >
            <option value="All">جميع الرتب</option>
            <option value="user">مستخدم عادي</option>
            <option value="admin">مسؤول (Admin)</option>
            <option value="superadmin">مدير عام (Superadmin)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-2xl py-2.5 px-3 text-xs text-slate-200 outline-none"
          >
            <option value="All">جميع الحالات</option>
            <option value="active">نشط (Active)</option>
            <option value="suspended">موقوف (Suspended)</option>
            <option value="banned">محظور (Banned)</option>
          </select>
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-bold">
              <tr>
                <th className="py-4 px-6">المستخدم</th>
                <th className="py-4 px-6">الرتبة والمستوى</th>
                <th className="py-4 px-6">الرصيد والنقاط</th>
                <th className="py-4 px-6">كود الإحالة</th>
                <th className="py-4 px-6">الحالة</th>
                <th className="py-4 px-6">تاريخ التسجيل</th>
                <th className="py-4 px-6 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    لا يوجد مستخدمون مطابقون لمعايير البحث.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-slate-800/40 transition-colors">
                    {/* User Profile */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
                          {(user.displayName || user.username || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-bold text-slate-100 truncate">{user.displayName || user.username}</div>
                          <div className="text-[11px] text-slate-400 font-mono truncate">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role & Level */}
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                          user.role === 'superadmin'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : user.role === 'admin'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {user.role}
                        </span>
                        <div className="text-[11px] text-amber-400 font-semibold">مستوى {user.level}</div>
                      </div>
                    </td>

                    {/* Balance & Points */}
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-black text-emerald-400 font-mono">
                          {(user.balance || 0).toFixed(2)} {settings.currencySymbol || 'ج.م'}
                        </div>
                        <div className="text-[10px] text-amber-400 font-mono">
                          {(user.points || 0).toLocaleString()} نقطة
                        </div>
                      </div>
                    </td>

                    {/* Referral Code */}
                    <td className="py-4 px-6 font-mono text-slate-300 text-xs">
                      <div>{user.referralCode}</div>
                      {user.referredBy && (
                        <div className="text-[10px] text-slate-400">دعوة: {user.referredBy}</div>
                      )}
                    </td>

                    {/* Account Status */}
                    <td className="py-4 px-6">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        user.accountStatus === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : user.accountStatus === 'suspended'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {user.accountStatus === 'active' ? 'نشط' : user.accountStatus === 'suspended' ? 'موقوف' : 'محظور'}
                      </span>
                    </td>

                    {/* Registration Date */}
                    <td className="py-4 px-6 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString('ar-EG')}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setViewDrawerOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="عرض التفاصيل الشاملة"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenFinancials(user)}
                          className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                          title="تعديل الرصيد / إضافة بونص"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenRoleLevel(user)}
                          className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
                          title="تعديل الرتبة والمستوى"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleBan(user)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            user.accountStatus === 'banned'
                              ? 'text-emerald-400 hover:bg-emerald-500/10'
                              : 'text-rose-400 hover:bg-rose-500/10'
                          }`}
                          title={user.accountStatus === 'banned' ? 'فك الحظر' : 'حظر الحساب'}
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FINANCIAL ADJUSTMENT MODAL */}
      {financialModalOpen && selectedUser && (
        <Modal
          isOpen={financialModalOpen}
          onClose={() => setFinancialModalOpen(false)}
          title={`تعديل مالي / بونص للمستخدم: ${selectedUser.username}`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveFinancials} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400">الرصيد الحالي:</span>
                <div className="font-bold text-emerald-400 font-mono">{selectedUser.balance.toFixed(2)} {settings.currencySymbol || 'ج.م'}</div>
              </div>
              <div className="text-left">
                <span className="text-slate-400">النقاط الحالية:</span>
                <div className="font-bold text-amber-400 font-mono">{selectedUser.points.toLocaleString()} نقطة</div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">نوع العملية</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('Bonus')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    adjustType === 'Bonus'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  🎁 مكافأة بونص (إضافة)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('Adjustment')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    adjustType === 'Adjustment'
                      ? 'bg-amber-600 text-white border-amber-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  ⚖️ تسوية رصيد إدارية
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">تغيير الرصيد ({settings.currencySymbol || 'ج.م'})</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={amountChange}
                  onChange={(e) => setAmountChange(e.target.value)}
                  placeholder="+ أو - المبلغ"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2 px-3 text-xs text-slate-100 outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">تغيير النقاط</label>
                <input
                  type="number"
                  step="100"
                  required
                  value={pointsChange}
                  onChange={(e) => setPointsChange(e.target.value)}
                  placeholder="+ أو - النقاط"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2 px-3 text-xs text-slate-100 outline-none font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">سبب التعديل المالي (سيسجل في Audit Log)</label>
              <textarea
                required
                rows={2}
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="اكتب سبب العملية بوضوح للتوثيق والشفافية..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2 px-3 text-xs text-slate-100 outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setFinancialModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={adjustLoading}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-950 transition-all flex items-center gap-2"
              >
                {adjustLoading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                <span>تنفيذ التعديل وتسجيل المعاملة</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* EDIT ROLE & LEVEL MODAL */}
      {roleLevelModalOpen && selectedUser && (
        <Modal
          isOpen={roleLevelModalOpen}
          onClose={() => setRoleLevelModalOpen(false)}
          title={`تعديل صلاحيات ومستوى: ${selectedUser.username}`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveRoleLevel} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">رتبة المستخدم (Role)</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as UserRole)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-100 outline-none"
              >
                <option value="user">مستخدم عادي (User)</option>
                <option value="admin">مسؤول لوحة التحكم (Admin)</option>
                <option value="superadmin">مدير عام كامل الصلاحيات (Superadmin)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">مستوى الحساب (Level)</label>
              <select
                value={editLevel}
                onChange={(e) => setEditLevel(e.target.value as UserLevelId)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-100 outline-none"
              >
                <option value="Bronze">برونزي (Bronze)</option>
                <option value="Silver">فضي (Silver)</option>
                <option value="Gold">ذهبي (Gold)</option>
                <option value="Platinum">بلاتيني (Platinum)</option>
                <option value="Diamond">ماسي (Diamond)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">حالة الحساب (Account Status)</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as AccountStatus)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-100 outline-none"
              >
                <option value="active">نشط (Active)</option>
                <option value="suspended">موقوف مؤقتاً (Suspended)</option>
                <option value="banned">محظور نهائياً (Banned)</option>
                <option value="under_review">تحت المراجعة والتدقيق (Under Review)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setRoleLevelModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={roleLevelLoading}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
              >
                {roleLevelLoading ? 'جارِ الحفظ...' : 'حفظ التعديلات'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* USER 360 DRAWER */}
      {viewDrawerOpen && selectedUser && (
        <Modal
          isOpen={viewDrawerOpen}
          onClose={() => setViewDrawerOpen(false)}
          title={`الملف الكامل للمستخدم: ${selectedUser.displayName || selectedUser.username}`}
          maxWidth="2xl"
        >
          <div className="space-y-6 text-xs text-slate-300">
            {/* Summary Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400">الرصيد المتاح</span>
                <div className="text-base font-black text-emerald-400 mt-0.5">{selectedUser.balance.toFixed(2)} {settings.currencySymbol || 'ج.م'}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400">النقاط</span>
                <div className="text-base font-black text-amber-400 mt-0.5">{selectedUser.points.toLocaleString()}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400">إجمالي الأرباح</span>
                <div className="text-base font-black text-white mt-0.5">{selectedUser.totalEarned.toFixed(2)} {settings.currencySymbol || 'ج.م'}</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400">المهام المكتملة</span>
                <div className="text-base font-black text-cyan-400 mt-0.5">{selectedUser.completedTasks || 0}</div>
              </div>
            </div>

            {/* User Meta */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-slate-400">المعرف (UID):</span> <code className="font-mono text-[10px] text-slate-300">{selectedUser.uid}</code></div>
                <div><span className="text-slate-400">البريد:</span> <span className="font-mono">{selectedUser.email}</span></div>
                <div><span className="text-slate-400">كود الإحالة:</span> <span className="font-mono font-bold text-emerald-400">{selectedUser.referralCode}</span></div>
                <div><span className="text-slate-400">تمت دعوته بواسطة:</span> <span className="font-mono">{selectedUser.referredBy || 'تسجيل مباشر'}</span></div>
                <div><span className="text-slate-400">تاريخ التسجيل:</span> <span>{new Date(selectedUser.createdAt).toLocaleString('ar-EG')}</span></div>
                <div><span className="text-slate-400">آخر تسجيل دخول:</span> <span>{new Date(selectedUser.lastLoginAt || selectedUser.createdAt).toLocaleString('ar-EG')}</span></div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setViewDrawerOpen(false);
                  handleOpenFinancials(selectedUser);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                تعديل الرصيد / بونص
              </button>
              <button
                type="button"
                onClick={() => setViewDrawerOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                إغلاق
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
