import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Wallet, 
  Users, 
  Menu, 
  Bell,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MobileBottomNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onToggleDrawer: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentPath,
  onNavigate,
  onToggleDrawer
}) => {
  const { userProfile, isAdmin } = useAuth();

  const isCurrent = (path: string) => {
    if (path === '/dashboard' && currentPath === '/dashboard') return true;
    if (path === '/tasks' && currentPath.startsWith('/tasks')) return true;
    if (path === '/wallet' && (currentPath === '/wallet' || currentPath === '/withdraw')) return true;
    if (path === '/referrals' && currentPath === '/referrals') return true;
    return false;
  };

  const navItems = [
    { label: 'الرئيسية', path: '/dashboard', icon: LayoutDashboard },
    { label: 'المهام', path: '/tasks', icon: CheckSquare, badge: 'كسب' },
    { label: 'المحفظة', path: '/wallet', icon: Wallet },
    { label: 'الإحالات', path: '/referrals', icon: Users },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 lg:hidden px-2 py-1.5 shadow-2xl safe-area-bottom">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isCurrent(item.path);
          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 ${
                active
                  ? 'text-emerald-400 font-bold scale-105'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${active ? 'text-emerald-400' : 'text-slate-400'}`} />
                {item.badge && !active && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </div>
              <span className="text-[10px] mt-1 font-medium tracking-tight">
                {item.label}
              </span>
              {active && (
                <span className="absolute -bottom-0.5 w-6 h-0.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500" />
              )}
            </button>
          );
        })}

        {/* More / Menu Button to open Drawer */}
        <button
          onClick={onToggleDrawer}
          className="flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl text-slate-400 hover:text-white transition-colors relative"
        >
          <div className="relative">
            <Menu className="w-5 h-5" />
            {isAdmin && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-slate-950" />
            )}
          </div>
          <span className="text-[10px] mt-1 font-medium text-slate-400">
            {isAdmin ? 'الأدمن' : 'المزيد'}
          </span>
        </button>
      </div>
    </nav>
  );
};
