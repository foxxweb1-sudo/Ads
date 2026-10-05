import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Trash2, CheckCircle2, ArrowUpRight, Gift, ShieldAlert, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { dbRefs } from '../lib/firebase';
import { Notification } from '../types';
import { onValue, update, remove } from 'firebase/database';

export const NotificationsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { success } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = onValue(dbRefs.notifications(), (snap) => {
      if (snap.exists()) {
        const all: Record<string, Notification> = snap.val();
        const list = Object.values(all)
          .filter((n) => n.userId === currentUser.uid)
          .sort((a, b) => b.createdAt - a.createdAt);
        setNotifications(list);
      } else {
        setNotifications([]);
      }
    });
    return () => unsub();
  }, [currentUser]);

  const markAllAsRead = async () => {
    if (!notifications.length) return;
    const updates: Record<string, any> = {};
    notifications.forEach((n) => {
      if (!n.isRead) updates[`notifications/${n.id}/isRead`] = true;
    });
    if (Object.keys(updates).length > 0) {
      await update(dbRefs.notifications(), updates);
      success('تم تحديد جميع الإشعارات كمقروءة.');
    }
  };

  const deleteNotification = async (id: string) => {
    await remove(dbRefs.notification(id));
    success('تم حذف الإشعار.');
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'task':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-5 h-5 text-purple-400" />;
      case 'referral':
        return <Gift className="w-5 h-5 text-cyan-400" />;
      case 'level':
        return <Sparkles className="w-5 h-5 text-amber-400" />;
      default:
        return <Bell className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">مركز الإشعارات والتنبيهات</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            تابع تحديثات أرباحك، إشعارات السحب، وترقيات مستواك في المنصة.
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors flex items-center gap-2"
          >
            <CheckCheck className="w-4 h-4 text-emerald-400" />
            <span>تحديد الكل كمقروء</span>
          </button>
        )}
      </div>

      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden divide-y divide-slate-800/80 shadow-xl">
        {notifications.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-400 space-y-2">
            <Bell className="w-8 h-8 text-slate-600 mx-auto" />
            <p>لا توجد إشعارات حالياً.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 flex items-start justify-between gap-4 transition-colors ${
                !n.isRead ? 'bg-emerald-950/20' : 'hover:bg-slate-800/30'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-2xl bg-slate-800 border border-slate-700/60 shrink-0 mt-0.5">
                  {getIcon(n.type)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-white">{n.title}</h3>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-slate-500 block pt-1">
                    {new Date(n.createdAt).toLocaleString('ar-EG')}
                  </span>
                </div>
              </div>

              <button
                onClick={() => deleteNotification(n.id)}
                className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
                title="حذف"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
