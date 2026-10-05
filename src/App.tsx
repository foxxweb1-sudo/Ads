import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Topbar } from './components/Topbar';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { LandingPage } from './views/LandingPage';
import { Login } from './views/Login';
import { Register } from './views/Register';
import { ForgotPassword } from './views/ForgotPassword';
import { UserDashboard } from './views/UserDashboard';
import { TasksPage } from './views/TasksPage';
import { WalletPage } from './views/WalletPage';
import { WithdrawPage } from './views/WithdrawPage';
import { TransactionsPage } from './views/TransactionsPage';
import { ReferralsPage } from './views/ReferralsPage';
import { NotificationsPage } from './views/NotificationsPage';
import { ProfilePage } from './views/ProfilePage';
import { HelpPage } from './views/HelpPage';
import { VerifyOtpPage } from './views/VerifyOtpPage';

// Admin Views
import { AdminOverview } from './views/admin/AdminOverview';
import { AdminUsers } from './views/admin/AdminUsers';
import { AdminTasks } from './views/admin/AdminTasks';
import { AdminWithdrawals } from './views/admin/AdminWithdrawals';
import { AdminTransactions } from './views/admin/AdminTransactions';
import { AdminLoginLogs } from './views/admin/AdminLoginLogs';
import { AdminActivity } from './views/admin/AdminActivity';
import { AdminReferrals } from './views/admin/AdminReferrals';
import { AdminFraud } from './views/admin/AdminFraud';
import { AdminLevels } from './views/admin/AdminLevels';
import { AdminPaymentMethods } from './views/admin/AdminPaymentMethods';
import { AdminSettings } from './views/admin/AdminSettings';

import { Task } from './types';
import { ShieldAlert, LogOut } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentUser, userProfile, loading, isAdmin, is2FAVerified, logout } = useAuth();
  
  // Clean hash/path router
  const [currentPath, setCurrentPath] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || '/';
  });
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<Task | null>(null);

  // Sync hash with path
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const cleanPath = hash.split('?')[0] || '/';
      setCurrentPath(cleanPath);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400">جارِ التحقق من جلسة العمل والاتصال...</p>
      </div>
    );
  }

  // Account Suspension / Ban Screen
  if (currentUser && userProfile && (userProfile.accountStatus === 'banned' || userProfile.accountStatus === 'suspended')) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-rose-500/40 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-white">
              {userProfile.accountStatus === 'banned' ? 'تم حظر هذا الحساب' : 'الحساب موقوف مؤقتاً'}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              تم إيقاف صلاحيات الحساب نتيجة رصد نشاط مخالف للشروط (مثل استخدام VPN، الحسابات المتعددة، أو التلاعب في كود الإحالة).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
            لتقديم التماس أو مراجعة الحساب، يرجى التواصل مع الدعم الفني:
            <div className="font-mono text-emerald-400 mt-1">support@smartearn.com</div>
          </div>

          <button
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>
    );
  }

  // Determine if viewing public page or user dashboard
  const isPublicRoute = 
    currentPath === '/' || 
    currentPath === '/login' || 
    currentPath === '/register' || 
    currentPath === '/forgot-password';

  // Render Public Auth & Landing Pages if requested or user not logged in on public paths
  if (!currentUser) {
    if (currentPath === '/login') return <Login onNavigate={navigate} />;
    if (currentPath === '/register') return <Register onNavigate={navigate} />;
    if (currentPath === '/forgot-password') return <ForgotPassword onNavigate={navigate} />;
    if (currentPath === '/help') return <HelpPage />;
    return <LandingPage onNavigate={navigate} />;
  }

  // Device Login Verification (2FA OTP) Required before entering platform
  if (!is2FAVerified) {
    return <VerifyOtpPage onSuccess={() => navigate('/dashboard')} />;
  }

  // If user is logged in and visits public landing/auth pages, let them view landing or dashboard
  if (currentPath === '/') {
    return <LandingPage onNavigate={navigate} />;
  }
  if (currentPath === '/login' || currentPath === '/register' || currentPath === '/forgot-password') {
    navigate('/dashboard');
    return null;
  }

  // Admin Route Protection
  const isAdminRoute = currentPath.startsWith('/admin');
  if (isAdminRoute && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-rose-500/30 text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">غير مصرح بالوصول</h2>
          <p className="text-xs text-slate-400">هذه اللوحة مخصصة فقط لمسؤولي ومدريري النظام (Admins).</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
          >
            العودة للوحة المستخدم
          </button>
        </div>
      </div>
    );
  }

  // Render Dashboard Layout
  const renderDashboardView = () => {
    switch (currentPath) {
      case '/dashboard':
        return (
          <UserDashboard
            onNavigate={navigate}
            onOpenTask={(task) => {
              setSelectedTaskForModal(task);
              navigate('/tasks');
            }}
          />
        );
      case '/tasks':
        return (
          <TasksPage
            selectedTask={selectedTaskForModal}
            onCloseTaskModal={() => setSelectedTaskForModal(null)}
          />
        );
      case '/wallet':
        return <WalletPage onNavigate={navigate} />;
      case '/withdraw':
        return <WithdrawPage onNavigate={navigate} />;
      case '/transactions':
        return <TransactionsPage />;
      case '/referrals':
        return <ReferralsPage />;
      case '/notifications':
        return <NotificationsPage />;
      case '/profile':
        return <ProfilePage />;
      case '/help':
        return <HelpPage />;

      // Admin Routes
      case '/admin':
        return <AdminOverview onNavigate={navigate} />;
      case '/admin/users':
        return <AdminUsers />;
      case '/admin/tasks':
        return <AdminTasks />;
      case '/admin/withdrawals':
        return <AdminWithdrawals />;
      case '/admin/transactions':
        return <AdminTransactions />;
      case '/admin/login-logs':
        return <AdminLoginLogs />;
      case '/admin/activity':
        return <AdminActivity />;
      case '/admin/referrals':
        return <AdminReferrals />;
      case '/admin/fraud':
        return <AdminFraud />;
      case '/admin/levels':
        return <AdminLevels />;
      case '/admin/payment-methods':
        return <AdminPaymentMethods />;
      case '/admin/settings':
        return <AdminSettings />;

      default:
        return (
          <UserDashboard
            onNavigate={navigate}
            onOpenTask={(task) => {
              setSelectedTaskForModal(task);
              navigate('/tasks');
            }}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Sidebar */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={navigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:mr-72 min-h-screen">
        <Topbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          currentPath={currentPath}
          onNavigate={navigate}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto animate-in fade-in duration-150">
          {renderDashboardView()}
        </main>
      </div>

      {/* Mobile & Tablet Bottom Navigation Bar */}
      <MobileBottomNav
        currentPath={currentPath}
        onNavigate={navigate}
        onToggleDrawer={() => setSidebarOpen(true)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
