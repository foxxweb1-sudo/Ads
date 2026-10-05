import React, { useEffect } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Wallet, 
  ArrowUpRight, 
  History, 
  Users, 
  Bell, 
  User, 
  HelpCircle, 
  ShieldAlert, 
  ShieldCheck, 
  Layers, 
  Sliders, 
  CreditCard, 
  FileText, 
  Activity, 
  Sparkles,
  Zap,
  LogOut,
  X,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate, isOpen, onClose }) => {
  const { userProfile, isAdmin, logout, isOnline } = useAuth();

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const isCurrent = (path: string) => {
    if (path === '/admin' && currentPath === '/admin') return true;
    if (path !== '/admin' && path.startsWith('/admin') && currentPath === path) return true;
    return currentPath === path;
  };

  const userNavItems = [
    { label: 'الرئيسية (Dashboard)', path: '/dashboard', icon: LayoutDashboard },
    { label: 'سوق المهام اليومية', path: '/tasks', icon: CheckSquare, badge: 'كسب فوري' },
    { label: 'المحفظة والرصيد', path: '/wallet', icon: Wallet },
    { label: 'طلب سحب أرباح', path: '/withdraw', icon: ArrowUpRight },
    { label: 'سجل المعاملات', path: '/transactions', icon: History },
    { label: 'برنامج الإحالات', path: '/referrals', icon: Users, badge: `${userProfile?.level === 'Diamond' ? '20%' : '5%'}` },
    { label: 'الإشعارات', path: '/notifications', icon: Bell },
    { label: 'الملف الشخصي', path: '/profile', icon: User },
    { label: 'المساعدة والدعم', path: '/help', icon: HelpCircle }
  ];

  const adminNavItems = [
    { label: 'نظرة عامة (Analytics)', path: '/admin', icon: LayoutDashboard },
    { label: 'إدارة المستخدمين', path: '/admin/users', icon: Users },
    { label: 'إدارة المهام والعروض', path: '/admin/tasks', icon: CheckSquare },
    { label: 'طلبات السحب', path: '/admin/withdrawals', icon: ArrowUpRight },
    { label: 'العمليات المالية', path: '/admin/transactions', icon: History },
    { label: 'سجلات الدخول والأمان', path: '/admin/login-logs', icon: ShieldCheck },
    { label: 'سجل الأنشطة الحي', path: '/admin/activity', icon: Activity },
    { label: 'شبكة الإحالات', path: '/admin/referrals', icon: Layers },
    { label: 'مكافحة الاحتيال', path: '/admin/fraud', icon: ShieldAlert },
    { label: 'إدارة المستويات', path: '/admin/levels', icon: Sparkles },
    { label: 'طرق الدفع والسحب', path: '/admin/payment-methods', icon: CreditCard },
    { label: 'إعدادات المنصة', path: '/admin/settings', icon: Sliders }
  ];

  const handleNav = (path: string) => {
    onNavigate(path);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile & Tablet Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md lg:hidden transition-all duration-300 animate-in fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar Drawer Container (Responsive for Mobile, Tablet, Desktop) */}
      <aside
        className={`fixed top-0 bottom-0 right-0 z-50 w-[85vw] max-w-sm sm:w-88 md:w-96 lg:w-72 bg-slate-900 border-l border-slate-800 flex flex-col transition-transform duration-300 ease-out lg:translate-x-0 shadow-2xl ${
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-18 px-5 sm:px-6 flex items-center justify-between border-b border-slate-800 shrink-0 bg-slate-900/90">
          <div 
            onClick={() => handleNav(isAdmin && currentPath.startsWith('/admin') ? '/admin' : '/dashboard')}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30">
              <Zap className="w-6 h-6 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  SmartEarn
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  PRO
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                <span>{isOnline ? 'متصل الآن' : 'غير متصل'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden transition-colors border border-slate-800"
            title="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 touch-pan-y overscroll-contain">
          {/* User Links */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              القائمة الرئيسية
            </div>
            <div className="space-y-1">
              {userNavItems.map((item) => {
                const Icon = item.icon;
                const active = isCurrent(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNav(item.path)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all group ${
                      active
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30 font-bold scale-[1.01]'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80 active:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'} transition-colors shrink-0`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                        active 
                          ? 'bg-emerald-700 text-emerald-100' 
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Admin Links */}
          {isAdmin && (
            <div className="pt-3 border-t border-slate-800/80">
              <div className="px-3 mb-2 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                  لوحة الإدارة (Admin)
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-extrabold border border-amber-500/30">
                  {userProfile?.role}
                </span>
              </div>
              <div className="space-y-1">
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isCurrent(item.path);
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNav(item.path)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all group ${
                        active
                          ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/30 font-bold'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${active ? 'text-white' : 'text-amber-400/80 group-hover:text-amber-300'} transition-colors shrink-0`} />
                        <span>{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User Card in Drawer Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 shrink-0">
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
                {(userProfile?.displayName || userProfile?.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                  {userProfile?.displayName || userProfile?.username}
                </p>
                <p className="text-[11px] text-emerald-400 font-bold font-mono">
                  {(userProfile?.balance || 0).toFixed(2)} ج.م
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                await logout();
                onNavigate('/');
              }}
              title="تسجيل الخروج"
              className="p-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
