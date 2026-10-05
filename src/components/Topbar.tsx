import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  Wallet, 
  Coins, 
  Menu, 
  User as UserIcon, 
  LogOut, 
  ChevronDown, 
  Shield, 
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dbRefs } from '../lib/firebase';
import { Notification, PlatformSettings } from '../types';
import { onValue, update } from 'firebase/database';
import { DEFAULT_SETTINGS } from '../lib/constants';

interface TopbarProps {
  onToggleSidebar: () => void;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar, currentPath, onNavigate }) => {
  const { userProfile, currentUser, logout, isAdmin, isOnline } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Listen to platform settings
  useEffect(() => {
    const unsub = onValue(dbRefs.settings(), (snap) => {
      if (snap.exists()) {
        setSettings(snap.val());
      }
    });
    return () => unsub();
  }, []);

  // Listen to user notifications
  useEffect(() => {
    if (!currentUser) return;
    const unsub = onValue(dbRefs.notifications(), (snap) => {
      if (snap.exists()) {
        const all: Record<string, Notification> = snap.val();
        const userNotifs = Object.values(all)
          .filter((n) => n.userId === currentUser.uid)
          .sort((a, b) => b.createdAt - a.createdAt);
        setNotifications(userNotifs);
      } else {
        setNotifications([]);
      }
    });
    return () => unsub();
  }, [currentUser]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = async () => {
    if (!notifications.length) return;
    const updates: Record<string, any> = {};
    notifications.forEach((n) => {
      if (!n.isRead) {
        updates[`notifications/${n.id}/isRead`] = true;
      }
    });
    if (Object.keys(updates).length > 0) {
      await update(dbRefs.notifications(), updates);
    }
  };

  const getLevelBadge = (level?: string) => {
    switch (level) {
      case 'Diamond':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'Platinum':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'Gold':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'Silver':
        return 'bg-slate-400/10 text-slate-300 border-slate-400/30';
      default:
        return 'bg-amber-600/10 text-amber-500 border-amber-600/30';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 md:px-6 flex items-center justify-between">
      {/* Right Side (RTL Start): Menu trigger + Page Title / Presence */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden transition-colors"
          title="القائمة"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          {/* Presence Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-medium">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
            <span className="text-slate-300">
              {isOnline ? '🟢 متصل الآن' : '⚪ غير متصل'}
            </span>
          </div>

          {userProfile?.level && (
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${getLevelBadge(userProfile.level)}`}>
              <Sparkles className="w-3 h-3" />
              {userProfile.level}
            </span>
          )}
        </div>
      </div>

      {/* Left Side (RTL End): Balance, Points, Notifications, User Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Points Pill */}
        <button
          onClick={() => onNavigate('/wallet')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-xs sm:text-sm font-bold transition-all"
        >
          <Coins className="w-4 h-4 text-amber-400 animate-spin-slow" />
          <span>{(userProfile?.points || 0).toLocaleString('en-US')}</span>
          <span className="text-[10px] text-amber-400/80 font-normal hidden sm:inline">نقطة</span>
        </button>

        {/* Balance Pill */}
        <button
          onClick={() => onNavigate('/wallet')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-bold transition-all shadow-sm"
        >
          <Wallet className="w-4 h-4 text-emerald-400" />
          <span>{(userProfile?.balance || 0).toFixed(2)}</span>
          <span className="text-[11px] font-normal">{settings.currencySymbol || 'ج.م'}</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95">
              <div className="p-3 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-100">الإشعارات</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {unreadCount} جديد
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    تحديد الكل كمقروء
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    لا توجد إشعارات جديدة حالياً
                  </div>
                ) : (
                  notifications.slice(0, 6).map((n) => (
                    <div
                      key={n.id}
                      className={`p-3.5 hover:bg-slate-800/40 transition-colors ${!n.isRead ? 'bg-emerald-950/20' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-200">{n.title}</h4>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(n.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-slate-800 text-center bg-slate-900/60">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    onNavigate('/notifications');
                  }}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  عرض جميع الإشعارات ({notifications.length})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-md overflow-hidden">
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                (userProfile?.displayName || userProfile?.username || 'U').charAt(0).toUpperCase()
              )}
            </div>
            <div className="hidden md:block text-right">
              <p className="text-xs font-bold text-slate-200 truncate max-w-[100px]">
                {userProfile?.displayName || userProfile?.username || 'المستخدم'}
              </p>
              <p className="text-[10px] text-slate-400">
                {isAdmin ? '🛡️ مسؤول النظام' : `مستوى ${userProfile?.level || 'Bronze'}`}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
          </button>

          {showUserMenu && (
            <div className="absolute left-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="p-3 border-b border-slate-800 mb-1">
                <p className="text-xs font-bold text-slate-200 truncate">
                  {userProfile?.displayName || userProfile?.username}
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {userProfile?.email}
                </p>
              </div>

              {isAdmin && (
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onNavigate('/admin');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500/10 rounded-xl transition-colors mb-1"
                >
                  <Shield className="w-4 h-4" />
                  <span>لوحة تحكم الأدمن</span>
                </button>
              )}

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onNavigate('/profile');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                <UserIcon className="w-4 h-4" />
                <span>الملف الشخصي</span>
              </button>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onNavigate('/wallet');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                <Wallet className="w-4 h-4" />
                <span>المحفظة والسحب</span>
              </button>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onNavigate('/help');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                <span>المساعدة والدعم</span>
              </button>

              <div className="border-t border-slate-800 my-1" />

              <button
                onClick={async () => {
                  setShowUserMenu(false);
                  await logout();
                  onNavigate('/');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
