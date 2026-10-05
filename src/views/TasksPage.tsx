import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Search, 
  Filter, 
  Clock, 
  Coins, 
  Lock, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle,
  Timer,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { dbRefs } from '../lib/firebase';
import { Task, TaskCategory, UserLevelId, LevelConfig, PlatformSettings } from '../types';
import { onValue } from 'firebase/database';
import { completeTask } from '../lib/dbService';
import { Modal } from '../components/Modal';
import { DEFAULT_LEVELS, DEFAULT_SETTINGS } from '../lib/constants';

interface TasksPageProps {
  selectedTask?: Task | null;
  onCloseTaskModal?: () => void;
}

export const TasksPage: React.FC<TasksPageProps> = ({ selectedTask: initialTask, onCloseTaskModal }) => {
  const { userProfile } = useAuth();
  const { success, error: toastError } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('All');

  const [activeTask, setActiveTask] = useState<Task | null>(initialTask || null);
  const [executing, setExecuting] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [timerActive, setTimerActive] = useState(false);
  const [codeProof, setCodeProof] = useState('');
  const [urlProof, setUrlProof] = useState('');
  const [levels, setLevels] = useState<Record<string, LevelConfig>>(DEFAULT_LEVELS);
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (initialTask) {
      handleOpenTask(initialTask);
    }
  }, [initialTask]);

  // Sync settings and levels
  useEffect(() => {
    const unsubSettings = onValue(dbRefs.settings(), (snap) => {
      if (snap.exists()) setSettings(snap.val());
    });
    const unsubLevels = onValue(dbRefs.levels(), (snap) => {
      if (snap.exists()) setLevels(snap.val());
    });
    return () => {
      unsubSettings();
      unsubLevels();
    };
  }, []);

  // Sync Tasks
  useEffect(() => {
    const unsub = onValue(dbRefs.tasks(), (snap) => {
      if (snap.exists()) {
        const all: Record<string, Task> = snap.val();
        const activeList = Object.values(all).filter((t) => t.status === 'Active');
        setTasks(activeList);
      } else {
        setTasks([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Timer countdown hook
  useEffect(() => {
    let interval: any = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && timerActive) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  const categories: { label: string; value: string }[] = [
    { label: 'جميع المهام', value: 'All' },
    { label: 'زيارة مواقع (Website Visit)', value: 'Website Visit' },
    { label: 'استطلاعات رأي (Survey)', value: 'Survey' },
    { label: 'عروض وتطبيقات (External Offer)', value: 'External Offer' },
    { label: 'مهام سوشيال (Social Task)', value: 'Social Task' },
    { label: 'روابط ذكية (SmartLink)', value: 'SmartLink' },
    { label: 'مهام مخصصة (Custom Task)', value: 'Custom Task' }
  ];

  const userLevel = userProfile?.level || 'Bronze';
  const levelInfo = levels[userLevel] || DEFAULT_LEVELS.Bronze;
  const levelMultiplier = levelInfo.taskMultiplier || 1.0;

  const levelHierarchy: Record<UserLevelId, number> = {
    Bronze: 1,
    Silver: 2,
    Gold: 3,
    Platinum: 4,
    Diamond: 5
  };

  const isLevelUnlocked = (taskRequiredLevel: UserLevelId) => {
    return (levelHierarchy[userLevel] || 1) >= (levelHierarchy[taskRequiredLevel] || 1);
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesCategory = selectedCategory === 'All' || task.category === selectedCategory;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === 'All' || task.requiredLevel === levelFilter;
    return matchesCategory && matchesSearch && matchesLevel;
  });

  const handleOpenTask = (task: Task) => {
    if (!isLevelUnlocked(task.requiredLevel)) {
      toastError(`هذه المهمة مخصصة لمستوى ${task.requiredLevel} فأعلى.`);
      return;
    }
    setActiveTask(task);
    setCodeProof('');
    setUrlProof('');
    if (task.verificationType === 'timer') {
      const defaultDuration = task.verificationTimerSeconds || 30;
      setTimerSeconds(defaultDuration);
      setTimerActive(false);
    }
  };

  const handleStartTaskUrl = () => {
    if (!activeTask) return;
    window.open(activeTask.url, '_blank');
    if (activeTask.verificationType === 'timer' && !timerActive && timerSeconds > 0) {
      setTimerActive(true);
    }
  };

  const handleCompleteTask = async () => {
    if (!activeTask || !userProfile) return;

    if (activeTask.verificationType === 'timer' && timerSeconds > 0) {
      toastError(`يرجى الانتظار حتى اكتمال العداد التنازلي (${timerSeconds} ثانية متبقية).`);
      return;
    }

    if (activeTask.verificationType === 'code' && !codeProof.trim()) {
      toastError('يرجى إدخال رمز التحقق الخاص بالمهمة.');
      return;
    }

    if (activeTask.verificationType === 'proof_url' && !urlProof.trim()) {
      toastError('يرجى إدخال رابط الإثبات أو اسم المستخدم.');
      return;
    }

    try {
      setExecuting(true);
      const res = await completeTask(userProfile, activeTask, {
        code: codeProof.trim(),
        proofUrl: urlProof.trim()
      });

      if (res.success) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        success(res.message);
        setActiveTask(null);
        if (onCloseTaskModal) onCloseTaskModal();
      } else {
        toastError(res.message);
      }
    } catch (err: any) {
      toastError(err.message || 'فشل تسجيل اكتمال المهمة.');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${levelInfo.badgeColor}`}>
              مستوى {levelInfo.nameAr}
            </span>
            <span className="text-xs text-slate-400">
              مضاعف المكافأة الحالي: <strong className="text-emerald-400">x{levelMultiplier}</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">سوق المهام والعروض اليومية</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            أكمل المهام المعروضة أدناه لجمع النقاط وزيادة رصيدك في المحفظة لحظياً.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs space-y-1 shrink-0">
          <div className="font-bold flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>نصيحة للمضاعفة</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            الارتقاء إلى المستوى الذهبي أو الماسي يمنحك حتى 2x أرباح على كل مهمة!
          </p>
        </div>
      </div>

      {/* Search & Category Filter Tabs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن مهمة أو عرض..."
              className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-2xl py-2.5 pr-10 pl-4 text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 outline-none transition-colors"
            />
          </div>

          {/* Level Filter Dropdown */}
          <div className="w-full sm:w-48 shrink-0">
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-2xl py-2.5 px-3 text-xs sm:text-sm text-slate-200 outline-none"
            >
              <option value="All">جميع المستويات</option>
              <option value="Bronze">مستوى برونزي</option>
              <option value="Silver">مستوى فضي</option>
              <option value="Gold">مستوى ذهبي</option>
              <option value="Platinum">مستوى بلاتيني</option>
              <option value="Diamond">مستوى ماسي</option>
            </select>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const active = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                    : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TASKS GRID */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">جارِ تحميل المهام المتاحة...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">لا توجد مهام تطابق البحث حالياً</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            جرّب تغيير فئة البحث أو الفلتر لعرض المزيد من المهام المتاحة.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => {
            const unlocked = isLevelUnlocked(task.requiredLevel);
            const calculatedAmount = Number((task.rewardAmount * levelMultiplier).toFixed(2));
            const calculatedPoints = Math.round(task.rewardPoints * levelMultiplier);

            return (
              <div
                key={task.id}
                className={`p-6 rounded-3xl bg-slate-900 border transition-all flex flex-col justify-between space-y-6 ${
                  unlocked
                    ? 'border-slate-800 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-950/20'
                    : 'border-slate-800/60 opacity-60'
                }`}
              >
                <div className="space-y-4">
                  {/* Category & Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/60">
                      {task.category}
                    </span>
                    {task.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {task.badge}
                      </span>
                    )}
                  </div>

                  {/* Title & Desc */}
                  <div>
                    <h3 className="text-base font-bold text-white leading-snug line-clamp-2">
                      {task.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>
                  </div>

                  {/* Requirements & Time */}
                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{task.estimatedMinutes} دقيقة</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>المستوى المطلوب:</span>
                      <strong className={unlocked ? 'text-emerald-400' : 'text-amber-400'}>
                        {task.requiredLevel}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Bottom Rewards & Action */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-lg font-black text-emerald-400">
                      +{calculatedAmount} {settings.currencySymbol || 'ج.م'}
                    </div>
                    <div className="text-[11px] text-amber-400 font-bold">
                      +{calculatedPoints} نقطة
                    </div>
                  </div>

                  {unlocked ? (
                    <button
                      onClick={() => handleOpenTask(task)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-900/30 transition-all flex items-center gap-2 hover:scale-105"
                    >
                      <span>بدء المهمة</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold">
                      <Lock className="w-3.5 h-3.5" />
                      <span>مستوى {task.requiredLevel}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TASK EXECUTION MODAL */}
      {activeTask && (
        <Modal
          isOpen={Boolean(activeTask)}
          onClose={() => {
            setActiveTask(null);
            if (onCloseTaskModal) onCloseTaskModal();
          }}
          title={activeTask.title}
          maxWidth="lg"
        >
          <div className="space-y-6">
            {/* Reward Summary Pill */}
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">مكافأة الإنجاز لمستواك ({userLevel})</span>
                <div className="text-xl font-black text-emerald-400">
                  +{(activeTask.rewardAmount * levelMultiplier).toFixed(2)} {settings.currencySymbol || 'ج.م'}
                </div>
              </div>
              <div className="text-left">
                <span className="text-xs text-slate-400">النقاط المكتسبة</span>
                <div className="text-xl font-black text-amber-400">
                  +{Math.round(activeTask.rewardPoints * levelMultiplier)} نقطة
                </div>
              </div>
            </div>

            {/* Description & Instructions */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300">تعليمات التنفيذ:</h4>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                {activeTask.instructions || activeTask.description}
              </div>
            </div>

            {/* Step 1: Open Link */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-emerald-400 font-black">1</span>
                <span>زيارة صفحة المهمة أو التطبيق:</span>
              </div>
              <button
                type="button"
                onClick={handleStartTaskUrl}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all hover:border-slate-600"
              >
                <span>فتح الرابط في نافذة جديدة</span>
                <ExternalLink className="w-4 h-4 text-emerald-400" />
              </button>
            </div>

            {/* Step 2: Verification Specific Section */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-emerald-400 font-black">2</span>
                <span>التحقق من الإنجاز:</span>
              </div>

              {activeTask.verificationType === 'timer' && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-amber-400 font-mono text-xl font-black">
                    <Timer className="w-5 h-5" />
                    <span>{timerSeconds} ثانية متبقية</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {timerActive 
                      ? 'العداد يعمل الآن. ابقَ في الصفحة حتى ينتهي العداد لفتح زر التحقق.'
                      : timerSeconds === 0 
                      ? '✅ اكتمل وقت المهمة بنجاح! يمكنك الآن استلام المكافأة.'
                      : 'اضغط على زر "فتح الرابط" أعلاه لبدء تشغيل العداد التنازلي.'}
                  </p>
                </div>
              )}

              {activeTask.verificationType === 'code' && (
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400">أدخل رمز التأكيد الموجود في نهاية المهمة:</label>
                  <input
                    type="text"
                    value={codeProof}
                    onChange={(e) => setCodeProof(e.target.value)}
                    placeholder="رمز التأكيد (Confirmation Code)"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 outline-none"
                  />
                </div>
              )}

              {activeTask.verificationType === 'proof_url' && (
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400">أدخل رابط الإثبات أو اسم المستخدم الخاص بك:</label>
                  <input
                    type="text"
                    value={urlProof}
                    onChange={(e) => setUrlProof(e.target.value)}
                    placeholder="https://... أو @username"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 outline-none"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setActiveTask(null);
                  if (onCloseTaskModal) onCloseTaskModal();
                }}
                disabled={executing}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleCompleteTask}
                disabled={executing || (activeTask.verificationType === 'timer' && timerSeconds > 0)}
                className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-lg flex items-center gap-2 ${
                  activeTask.verificationType === 'timer' && timerSeconds > 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 hover:scale-105'
                }`}
              >
                {executing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{executing ? 'جارِ التحقق...' : 'تأكيد واستلام المكافأة'}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
