import React from 'react';
import { Zap, ArrowLeft, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PublicNavProps {
  onNavigate: (path: string) => void;
}

export const PublicNav: React.FC<PublicNavProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <div 
          onClick={() => onNavigate('/')} 
          className="flex items-center gap-3 cursor-pointer select-none"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-emerald-900/30">
            <Zap className="w-6 h-6 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                SmartEarn
              </span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">منصة المهام والأرباح الذكية</p>
          </div>
        </div>

        {/* Public Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#how-it-works" className="hover:text-emerald-400 transition-colors">كيف تعمل المنصة؟</a>
          <a href="#tasks-preview" className="hover:text-emerald-400 transition-colors">المهام والعروض</a>
          <a href="#levels" className="hover:text-emerald-400 transition-colors">نظام المستويات</a>
          <a href="#referrals" className="hover:text-emerald-400 transition-colors">برنامج الإحالات</a>
          <a href="#payment-methods" className="hover:text-emerald-400 transition-colors">طرق السحب</a>
          <a href="#faq" className="hover:text-emerald-400 transition-colors">الأسئلة الشائعة</a>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <button
              onClick={() => onNavigate('/dashboard')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-900/30 transition-all hover:scale-105"
            >
              <span>لوحة التحكم</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button
                onClick={() => onNavigate('/login')}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 text-sm font-semibold transition-colors border border-slate-800"
              >
                <LogIn className="w-4 h-4 text-slate-400" />
                <span>تسجيل الدخول</span>
              </button>
              <button
                onClick={() => onNavigate('/register')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-900/30 transition-all hover:scale-105"
              >
                <UserPlus className="w-4 h-4" />
                <span>إنشاء حساب مجاناً</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export const Footer: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg">
                <Zap className="w-5 h-5 fill-white" />
              </div>
              <span className="font-extrabold text-xl text-white">SmartEarn</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              المنصة الرائدة في العالم العربي لتنفيذ المهام اليومية المصغرة، وجمع النقاط، وتحويلها إلى دخل حقيقي وسحب فوري.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>نظام موثق وآمن 100% مع Firebase</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-slate-200 mb-4 text-xs uppercase tracking-wider">روابط سريعة</h4>
            <ul className="space-y-2.5 text-xs">
              <li><button onClick={() => onNavigate('/')} className="hover:text-emerald-400 transition-colors">الرئيسية</button></li>
              <li><button onClick={() => onNavigate('/tasks')} className="hover:text-emerald-400 transition-colors">سوق المهام اليومية</button></li>
              <li><button onClick={() => onNavigate('/register')} className="hover:text-emerald-400 transition-colors">التسجيل والبدء</button></li>
              <li><button onClick={() => onNavigate('/help')} className="hover:text-emerald-400 transition-colors">مركز المساعدة والدعم</button></li>
            </ul>
          </div>

          {/* Payment & Security */}
          <div>
            <h4 className="font-bold text-slate-200 mb-4 text-xs uppercase tracking-wider">طرق السحب المعتمدة</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2 text-slate-300">📱 فودافون كاش (Vodafone Cash)</li>
              <li className="flex items-center gap-2 text-slate-300">⚡ انستاباي (InstaPay)</li>
              <li className="flex items-center gap-2 text-slate-300">📱 أورنج كاش & اتصالات كاش</li>
              <li className="flex items-center gap-2 text-slate-300">🏛️ تحويل بنكي لكافة البنوك</li>
              <li className="flex items-center gap-2 text-slate-300">💎 العملات الرقمية (USDT TRC20)</li>
            </ul>
          </div>

          {/* Terms & Anti-Fraud */}
          <div>
            <h4 className="font-bold text-slate-200 mb-4 text-xs uppercase tracking-wider">الأمان والنزاهة</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              نحن نطبق سياسة صارمة ضد الغش واستخدام VPN أو الحسابات المتعددة للحفاظ على استدامة المنصة وحقوق جميع المستخدمين.
            </p>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
              🔒 معالجة طلبات السحب يومياً بدون تأخير
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} SmartEarn. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-6">
            <button onClick={() => onNavigate('/help')} className="hover:text-slate-300">الشروط والأحكام</button>
            <button onClick={() => onNavigate('/help')} className="hover:text-slate-300">سياسة الخصوصية</button>
            <button onClick={() => onNavigate('/help')} className="hover:text-slate-300">اتصل بنا</button>
          </div>
        </div>
      </div>
    </footer>
  );
};
