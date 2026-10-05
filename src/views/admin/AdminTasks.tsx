import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Copy, 
  Play, 
  Pause, 
  Coins, 
  Clock, 
  CheckCircle2, 
  ExternalLink,
  Sparkles,
  Zap,
  Sliders
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { dbRefs } from '../../lib/firebase';
import { Task, TaskCategory, UserLevelId, TaskStatus, VerificationType, PlatformSettings } from '../../types';
import { onValue, push, set, update, remove } from 'firebase/database';
import { logActivity } from '../../lib/dbService';
import { Modal, ConfirmModal } from '../../components/Modal';
import { DEFAULT_SETTINGS } from '../../lib/constants';

export const AdminTasks: React.FC = () => {
  const { userProfile: currentAdmin } = useAuth();
  const { success, error: toastError } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Website Visit');
  const [url, setUrl] = useState('');
  const [rewardAmount, setRewardAmount] = useState('2.5');
  const [rewardPoints, setRewardPoints] = useState('250');
  const [estimatedMinutes, setEstimatedMinutes] = useState('1');
  const [requiredLevel, setRequiredLevel] = useState<UserLevelId>('Bronze');
  const [dailyLimit, setDailyLimit] = useState('3');
  const [globalLimit, setGlobalLimit] = useState('0');
  const [cooldownMinutes, setCooldownMinutes] = useState('60');
  const [verificationType, setVerificationType] = useState<VerificationType>('timer');
  const [verificationTimerSeconds, setVerificationTimerSeconds] = useState('30');
  const [codeAnswer, setCodeAnswer] = useState('');
  const [badge, setBadge] = useState('');
  const [instructions, setInstructions] = useState('');
  const [status, setStatus] = useState<TaskStatus>('Active');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubSettings = onValue(dbRefs.settings(), (s) => s.exists() && setSettings(s.val()));
    const unsub = onValue(dbRefs.tasks(), (snap) => {
      if (snap.exists()) {
        const all: Record<string, Task> = snap.val();
        setTasks(Object.values(all).sort((a, b) => b.createdAt - a.createdAt));
      } else {
        setTasks([]);
      }
    });
    return () => {
      unsubSettings();
      unsub();
    };
  }, []);

  const openCreateModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setCategory('Website Visit');
    setUrl('https://');
    setRewardAmount('2.5');
    setRewardPoints('250');
    setEstimatedMinutes('1');
    setRequiredLevel('Bronze');
    setDailyLimit('3');
    setGlobalLimit('0');
    setCooldownMinutes('60');
    setVerificationType('timer');
    setVerificationTimerSeconds('30');
    setCodeAnswer('');
    setBadge('سهل وسريع');
    setInstructions('1. اضغط على الرابط.\n2. انتظر انتهاء العداد.\n3. اضغط تأكيد واستلم المكافأة.');
    setStatus('Active');
    setModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setCategory(task.category);
    setUrl(task.url);
    setRewardAmount(task.rewardAmount.toString());
    setRewardPoints(task.rewardPoints.toString());
    setEstimatedMinutes(task.estimatedMinutes.toString());
    setRequiredLevel(task.requiredLevel);
    setDailyLimit(task.dailyLimit.toString());
    setGlobalLimit(task.globalLimit.toString());
    setCooldownMinutes(task.cooldownMinutes.toString());
    setVerificationType(task.verificationType);
    setVerificationTimerSeconds((task.verificationTimerSeconds || 30).toString());
    setCodeAnswer(task.codeAnswer || '');
    setBadge(task.badge || '');
    setInstructions(task.instructions || '');
    setStatus(task.status);
    setModalOpen(true);
  };

  const handleDuplicateTask = async (task: Task) => {
    if (!currentAdmin) return;
    try {
      const newRef = push(dbRefs.tasks());
      const duplicated: Task = {
        ...task,
        id: newRef.key || Date.now().toString(),
        title: `${task.title} (نسخة مكررة)`,
        completionsCount: 0,
        createdAt: Date.now()
      };
      await set(newRef, duplicated);
      await logActivity({
        actorId: currentAdmin.uid,
        actorEmail: currentAdmin.email,
        action: 'Task Duplicated',
        description: `قام الأدمن بنسخ المهمة: ${task.title}`
      });
      success('تم تكرار المهمة بنجاح.');
    } catch (err: any) {
      toastError('فشل تكرار المهمة.');
    }
  };

  const handleToggleStatus = async (task: Task) => {
    if (!currentAdmin) return;
    const nextStatus: TaskStatus = task.status === 'Active' ? 'Paused' : 'Active';
    try {
      await update(dbRefs.task(task.id), { status: nextStatus });
      await logActivity({
        actorId: currentAdmin.uid,
        actorEmail: currentAdmin.email,
        action: `Task ${nextStatus}`,
        description: `قام الأدمن بتغيير حالة المهمة (${task.title}) إلى ${nextStatus}`
      });
      success(`تم تغيير حالة المهمة إلى ${nextStatus}.`);
    } catch (err: any) {
      toastError('فشل التحديث.');
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdmin) return;
    if (!title.trim() || !url.trim()) {
      toastError('يرجى ملء اسم المهمة والرابط.');
      return;
    }

    try {
      setSaving(true);
      const taskData: Omit<Task, 'id'> = {
        title: title.trim(),
        description: description.trim(),
        category,
        url: url.trim(),
        rewardAmount: parseFloat(rewardAmount) || 0,
        rewardPoints: parseInt(rewardPoints) || 0,
        estimatedMinutes: parseInt(estimatedMinutes) || 1,
        requiredLevel,
        dailyLimit: parseInt(dailyLimit) || 0,
        globalLimit: parseInt(globalLimit) || 0,
        cooldownMinutes: parseInt(cooldownMinutes) || 0,
        completionsCount: editingTask ? editingTask.completionsCount : 0,
        status,
        verificationType,
        verificationTimerSeconds: parseInt(verificationTimerSeconds) || 30,
        codeAnswer: codeAnswer.trim(),
        badge: badge.trim(),
        instructions: instructions.trim(),
        createdAt: editingTask ? editingTask.createdAt : Date.now(),
        updatedAt: Date.now()
      };

      if (editingTask) {
        await update(dbRefs.task(editingTask.id), taskData);
        await logActivity({
          actorId: currentAdmin.uid,
          actorEmail: currentAdmin.email,
          action: 'Task Updated',
          description: `تحديث المهمة: ${title}`
        });
        success('تم تحديث المهمة بنجاح.');
      } else {
        const newRef = push(dbRefs.tasks());
        await set(newRef, { ...taskData, id: newRef.key });
        await logActivity({
          actorId: currentAdmin.uid,
          actorEmail: currentAdmin.email,
          action: 'Task Created',
          description: `إضافة مهمة جديدة: ${title}`
        });
        success('تمت إضافة المهمة الجديدة بنجاح.');
      }

      setModalOpen(false);
    } catch (err: any) {
      toastError(err.message || 'فشل حفظ المهمة.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete || !currentAdmin) return;
    try {
      await remove(dbRefs.task(taskToDelete.id));
      await logActivity({
        actorId: currentAdmin.uid,
        actorEmail: currentAdmin.email,
        action: 'Task Deleted',
        description: `حذف المهمة: ${taskToDelete.title}`
      });
      success('تم حذف المهمة نهائياً.');
      setDeleteConfirmOpen(false);
      setTaskToDelete(null);
    } catch (err: any) {
      toastError('فشل حذف المهمة.');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
                        t.category.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'All' || t.category === categoryFilter;
    const matchStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">إدارة المهام والعروض</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            إضافة مهام جديدة، تخصيص المكافآت والنقاط، وتحديد قيود التكرار والشروط.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950 transition-all flex items-center gap-2 hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مهمة جديدة</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن مهمة..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-2.5 pr-10 pl-4 text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-2xl py-2.5 px-3 text-xs text-slate-200 outline-none"
          >
            <option value="All">جميع الفئات</option>
            <option value="Website Visit">Website Visit</option>
            <option value="Survey">Survey</option>
            <option value="External Offer">External Offer</option>
            <option value="Social Task">Social Task</option>
            <option value="SmartLink">SmartLink</option>
            <option value="Custom Task">Custom Task</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-2xl py-2.5 px-3 text-xs text-slate-200 outline-none"
          >
            <option value="All">جميع الحالات</option>
            <option value="Active">Active (نشطة)</option>
            <option value="Paused">Paused (موقوفة)</option>
            <option value="Disabled">Disabled (معطلة)</option>
          </select>
        </div>
      </div>

      {/* TASKS TABLE */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-bold">
              <tr>
                <th className="py-4 px-6">المهمة</th>
                <th className="py-4 px-6">الفئة والمستوى</th>
                <th className="py-4 px-6">المكافأة والنقاط</th>
                <th className="py-4 px-6">نوع التحقق</th>
                <th className="py-4 px-6">الإنجازات</th>
                <th className="py-4 px-6">الحالة</th>
                <th className="py-4 px-6 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    لا توجد مهام مسجلة تطابق البحث.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-100 max-w-xs truncate">{t.title}</div>
                      <a href={t.url} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-400 font-mono hover:underline flex items-center gap-1 mt-0.5">
                        <span>{t.url}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>

                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold inline-block mb-1">
                        {t.category}
                      </span>
                      <div className="text-[10px] text-amber-400 font-bold">مستوى {t.requiredLevel}</div>
                    </td>

                    <td className="py-4 px-6 font-mono">
                      <div className="text-emerald-400 font-black">+{t.rewardAmount.toFixed(2)} {settings.currencySymbol || 'ج.م'}</div>
                      <div className="text-amber-400 text-[10px]">+{t.rewardPoints} نقطة</div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="text-[11px] text-slate-300 font-medium">
                        {t.verificationType === 'timer' ? `⏱️ عداد (${t.verificationTimerSeconds || 30}ث)` : t.verificationType === 'code' ? '🔑 رمز سري' : '🔗 رابط إثبات'}
                      </span>
                    </td>

                    <td className="py-4 px-6 font-mono text-cyan-400 font-bold">
                      {t.completionsCount || 0} مرة
                    </td>

                    <td className="py-4 px-6">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        t.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : t.status === 'Paused'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {t.status === 'Active' ? 'نشطة' : t.status === 'Paused' ? 'موقوفة' : 'معطلة'}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(t)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            t.status === 'Active' ? 'text-amber-400 hover:bg-amber-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                          title={t.status === 'Active' ? 'إيقاف مؤقت' : 'تفعيل'}
                        >
                          {t.status === 'Active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEditModal(t)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="تعديل"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicateTask(t)}
                          className="p-1.5 rounded-lg text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                          title="تكرار المهمة"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setTaskToDelete(t);
                            setDeleteConfirmOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* CREATE / EDIT TASK MODAL */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingTask ? `تعديل المهمة: ${editingTask.title}` : 'إضافة مهمة جديدة'}
          maxWidth="2xl"
        >
          <form onSubmit={handleSaveTask} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-300">اسم المهمة (Title) *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: تصفح موقع المقالات وقراءة الأخبار"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-100 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300">وصف المهمة (Description)</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف مختصر يظهر في بطاقة المهمة..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-100 outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">فئة المهمة (Category)</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TaskCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-100 outline-none"
                >
                  <option value="Website Visit">Website Visit (زيارة موقع)</option>
                  <option value="Survey">Survey (استطلاع رأي)</option>
                  <option value="External Offer">External Offer (عرض شبكة خارجية / تطبيق)</option>
                  <option value="Social Task">Social Task (مهمة سوشيال ميديا)</option>
                  <option value="SmartLink">SmartLink (رابط ذكي)</option>
                  <option value="Custom Task">Custom Task (مهمة مخصصة)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">الرابط المستهدف (Target URL) *</label>
                <input
                  type="url"
                  required
                  dir="ltr"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-100 outline-none font-mono"
                />
              </div>
            </div>

            {/* Financial Rewards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">المكافأة الأساسية ({settings.currencySymbol || 'ج.م'})</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={rewardAmount}
                  onChange={(e) => setRewardAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-emerald-400 font-bold font-mono outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">النقاط الأساسية</label>
                <input
                  type="number"
                  step="10"
                  required
                  value={rewardPoints}
                  onChange={(e) => setRewardPoints(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-amber-400 font-bold font-mono outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">المستوى المطلوب</label>
                <select
                  value={requiredLevel}
                  onChange={(e) => setRequiredLevel(e.target.value as UserLevelId)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-slate-100 outline-none"
                >
                  <option value="Bronze">برونزي (الكل)</option>
                  <option value="Silver">فضي فما فوق</option>
                  <option value="Gold">ذهبي فما فوق</option>
                  <option value="Platinum">بلاتيني فما فوق</option>
                  <option value="Diamond">ماسي فقط</option>
                </select>
              </div>
            </div>

            {/* Limits & Cooldowns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">الحد اليومي للمستخدم (0 = لا نهائي)</label>
                <input
                  type="number"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-100 outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">وقت الانتظار (Cooldown بالدقائق)</label>
                <input
                  type="number"
                  value={cooldownMinutes}
                  onChange={(e) => setCooldownMinutes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-100 outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">الوقت المتوقع (بالدقائق)</label>
                <input
                  type="number"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-100 outline-none font-mono"
                />
              </div>
            </div>

            {/* Verification Configuration */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="font-bold text-slate-200">إعدادات التحقق من الإنجاز:</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400">نوع التحقق</label>
                  <select
                    value={verificationType}
                    onChange={(e) => setVerificationType(e.target.value as VerificationType)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-2.5 text-slate-100 outline-none"
                  >
                    <option value="timer">عداد تنازلي (Timer)</option>
                    <option value="code">رمز سري (Secret Code)</option>
                    <option value="proof_url">رابط إثبات / اسم مستخدم</option>
                    <option value="instant">فوري (Instant)</option>
                  </select>
                </div>

                {verificationType === 'timer' && (
                  <div className="space-y-1">
                    <label className="text-slate-400">مدة العداد (بالثواني)</label>
                    <input
                      type="number"
                      value={verificationTimerSeconds}
                      onChange={(e) => setVerificationTimerSeconds(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-slate-100 outline-none font-mono"
                    />
                  </div>
                )}

                {verificationType === 'code' && (
                  <div className="space-y-1">
                    <label className="text-slate-400">الرمز الصحيح (Answer Code)</label>
                    <input
                      type="text"
                      value={codeAnswer}
                      onChange={(e) => setCodeAnswer(e.target.value)}
                      placeholder="مثال: SMART2026"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-slate-100 outline-none font-mono uppercase"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-slate-400">بادج تسويقي (Badge)</label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="مثال: مميز / سريع"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-slate-100 outline-none"
                  />
                </div>
              </div>
            </div>

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
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg transition-all"
              >
                {saving ? 'جارِ الحفظ...' : editingTask ? 'حفظ التعديلات' : 'إضافة المهمة'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* DELETE CONFIRM MODAL */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteTask}
        title="تأكيد حذف المهمة"
        message={`هل أنت متأكد من رغبتك في حذف المهمة "${taskToDelete?.title}" نهائياً من المنصة؟`}
        confirmText="نعم، احذف المهمة"
        isDestructive={true}
      />
    </div>
  );
};
