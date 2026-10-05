import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Coins, 
  TrendingUp, 
  Users, 
  CheckSquare, 
  ArrowUpRight, 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink, 
  Shield, 
  Clock, 
  ChevronLeft,
  Award,
  Zap,
  Gift
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { dbRefs } from '../lib/firebase';
import { Task, Transaction, LevelConfig, PlatformSettings } from '../types';
import { onValue } from 'firebase/database';
import { DEFAULT_LEVELS, DEFAULT_SETTINGS } from '../lib/constants';

interface UserDashboardProps {
  onNavigate: (path: string) => void;
  onOpenTask: (task: Task) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ onNavigate, onOpenTask }) => {
  const { userProfile, currentUser, isOnline } = useAuth();
  const { success } = useToast();

  const [copied, setCopied] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [levels, setLevels] = useState<Record<string, LevelConfig>>(DEFAULT_LEVELS);
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);

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

  // Sync active tasks
  useEffect(() => {
    const unsubTasks = onValue(dbRefs.tasks(), (snap) => {
      if (snap.exists()) {
        const all: Record<string, Task> = snap.val();
        const activeList = Object.values(all).filter((t) => t.status === 'Active');
        setTasks(activeList);
      } else {
        setTasks([]);
      }
    });
    return () => unsubTasks();
  }, []);

  // Sync user transactions
  useEffect(() => {
    if (!currentUser) return;
    const unsubTx = onValue(dbRefs.transactions(), (snap) => {
      if (snap.exists()) {
        const all: Record<string, Transaction> = snap.val();
        const userTxs = Object.values(all)
          .filter((t) => t.userId === currentUser.uid)
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 5);
        setRecentTransactions(userTxs);
      } else {
        setRecentTransactions([]);
      }
    });
    return () => unsubTx();
  }, [currentUser]);

  const currentLevel = userProfile?.level || 'Bronze';
  const levelInfo = levels[currentLevel] || DEFAULT_LEVELS.Bronze;

  // Level Progression calculations
  const levelKeys = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
  const currentIdx = levelKeys.indexOf(currentLevel);
  const nextLevelKey = currentIdx < levelKeys.length - 1 ? levelKeys[currentIdx + 1] : null;
  const nextLevelInfo = nextLevelKey ? levels[nextLevelKey] || DEFAULT_LEVELS[nextLevelKey] : null;

  const currentPoints = userProfile?.points || 0;
  const prevLevelPoints = levelInfo.minPoints || 0;
  const nextLevelPoints = nextLevelInfo?.minPoints || 50000;
  
  let progressPercent = 100;
  if (nextLevelInfo) {
    const totalRequired = nextLevelPoints - prevLevelPoints;
    const currentProgress = Math.max(0, currentPoints - prevLevelPoints);
    progressPercent = Math.min(100, Math.round((currentProgress / totalRequired) * 100));
  }

  const referralUrl = `${window.location.origin}/register?ref=${userProfile?.referralCode || ''}`;

  const handleCopyReferral = () => {
    if (!userProfile?.referralCode) return;
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    success('تم نسخ رابط الإحالة الخاص بك بنجاح!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                مرحباً بك، {userProfile?.displayName || userProfile?.username}! 👋
              </h1>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-medium">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                <span className="text-slate-300">{isOnline ? 'متصل الآن' : 'غير متصل'}</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              تابع تنفيذ المهام، اجمع النقاط، وحوّلها إلى رصيد نقدي قابل للسحب الفوري.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => onNavigate('/tasks')}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 hover:scale-105"
            >
              <CheckSquare className="w-4 h-4" />
              <span>تنفيذ المهام</span>
            </button>
            <button
              onClick={() => onNavigate('/withdraw')}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
            >
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              <span>طلب سحب</span>
            </button>
          </div>
        </div>

        {/* Level Progression Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${levelInfo.badgeColor}`}>
                مستوى {levelInfo.nameAr}
              </span>
              <span className="text-slate-400">
                (مضاعف المهام: <strong className="text-emerald-400">x{levelInfo.taskMultiplier}</strong> - عمولة إحالة: <strong className="text-emerald-400">{levelInfo.referralPercentage}%</strong>)
              </span>
            </div>
            <div className="text-slate-300 font-mono text-[11px]">
              {nextLevelInfo ? (
                <span>
                  {currentPoints.toLocaleString()} / {nextLevelPoints.toLocaleString()} نقطة للوصول إلى {nextLevelInfo.nameAr}
                </span>
              ) : (
                <span className="text-purple-400 font-bold">💎 وصلت إلى الحد الأقصى (المستوى الماسي)</span>
              )}
            </div>
          </div>

          {/* Bar */}
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-500 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* METRICS CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Balance */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-emerald-500/30 transition-all space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">الرصيد الحالي المتاح</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {(userProfile?.balance || 0).toFixed(2)}{' '}
              <span className="text-xs text-slate-400 font-normal">{settings.currencySymbol || 'ج.م'}</span>
            </div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
              <Sparkles className="w-3 h-3" />
              <span>جاهز للسحب الفوري</span>
            </div>
          </div>
        </div>

        {/* Card 2: Points */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-amber-500/30 transition-all space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">إجمالي النقاط</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400">
              {(userProfile?.points || 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              تعادل تقريباً {((userProfile?.points || 0) / (settings.pointsPerCurrencyUnit || 100)).toFixed(2)} {settings.currencySymbol || 'ج.م'}
            </div>
          </div>
        </div>

        {/* Card 3: Total Earned */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-teal-500/30 transition-all space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">إجمالي الأرباح المكتسبة</span>
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {(userProfile?.totalEarned || 0).toFixed(2)}{' '}
              <span className="text-xs text-slate-400 font-normal">{settings.currencySymbol || 'ج.م'}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              تم سحب {(userProfile?.totalWithdrawn || 0).toFixed(2)} {settings.currencySymbol || 'ج.م'} منها
            </div>
          </div>
        </div>

        {/* Card 4: Referral Earnings */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">أرباح الإحالات</span>
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-cyan-400">
              {(userProfile?.referralEarnings || 0).toFixed(2)}{' '}
              <span className="text-xs text-slate-400 font-normal">{settings.currencySymbol || 'ج.م'}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              من {userProfile?.successfulReferrals || 0} صديق مسجل
            </div>
          </div>
        </div>
      </div>

      {/* REFERRAL QUICK BANNER */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-right w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">شارك رابط الإحالة واكسب {levelInfo.referralPercentage}% مدى الحياة</h3>
          </div>
          <p className="text-xs text-slate-400">
            كود الإحالة الخاص بك: <strong className="text-slate-200 font-mono">{userProfile?.referralCode}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex-1 md:w-72 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 truncate" dir="ltr">
            {referralUrl}
          </div>
          <button
            onClick={handleCopyReferral}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'تم النسخ!' : 'نسخ الرابط'}</span>
          </button>
        </div>
      </div>

      {/* QUICK TASKS & RECENT TRANSACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Available Tasks (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">مهام مقترحة للبدء الآن</h2>
              <p className="text-xs text-slate-400">مهام سريعة بعائد فوري ونقاط مضاعفة</p>
            </div>
            <button
              onClick={() => onNavigate('/tasks')}
              className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>عرض كل المهام ({tasks.length})</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
                لا توجد مهام نشطة حالياً. يرجى المراجعة لاحقاً.
              </div>
            ) : (
              tasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/30 transition-all flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
                      {task.category === 'Website Visit' ? '🌐' : task.category === 'Survey' ? '📝' : task.category === 'Social Task' ? '💬' : '⚡'}
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-100 truncate group-hover:text-emerald-400 transition-colors">
                          {task.title}
                        </h4>
                        {task.badge && (
                          <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                            {task.badge}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span>{task.category}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{task.estimatedMinutes} دقيقة</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-left">
                      <div className="text-xs sm:text-sm font-black text-emerald-400">
                        +{(task.rewardAmount * levelInfo.taskMultiplier).toFixed(2)} {settings.currencySymbol || 'ج.م'}
                      </div>
                      <div className="text-[10px] text-amber-400 font-semibold">
                        +{Math.round(task.rewardPoints * levelInfo.taskMultiplier)} نقطة
                      </div>
                    </div>
                    <button
                      onClick={() => onOpenTask(task)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 text-xs font-bold transition-all"
                    >
                      تنفيذ
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-white">آخر الحركات المالية</h2>
            <button
              onClick={() => onNavigate('/transactions')}
              className="text-xs font-bold text-slate-400 hover:text-emerald-400 transition-colors"
            >
              عرض الكل
            </button>
          </div>

          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            {recentTransactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                لا توجد معاملات مسجلة بعد. أكمل أول مهمة لتسجيل رصيدك!
              </div>
            ) : (
              recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="overflow-hidden">
                    <p className="font-bold text-slate-200 truncate">{tx.type}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{tx.description}</p>
                  </div>
                  <div className="text-left shrink-0">
                    <span className={`font-black ${tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {tx.amount >= 0 ? '+' : ''}{tx.amount.toFixed(2)} {settings.currencySymbol || 'ج.م'}
                    </span>
                    <p className="text-[10px] text-slate-400">
                      {new Date(tx.timestamp).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
