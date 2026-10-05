import React, { useState } from 'react';
import { HelpCircle, ShieldAlert, CheckCircle2, MessageSquare, Send, ChevronDown, ChevronUp, Mail, Zap } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const HelpPage: React.FC = () => {
  const { success } = useToast();
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const faqs = [
    {
      q: 'متى يتم تحويل طلب السحب بعد إرساله؟',
      a: 'تتم معالجة جميع طلبات السحب يومياً من الساعة 10:00 صباحاً وحتى 10:00 مساءً بتوقيت القاهرة. متوسط وقت الإيداع عبر فودافون كاش وانستاباي يتراوح بين 15 دقيقة إلى 3 ساعات كحد أقصى.'
    },
    {
      q: 'لماذا لم يتم احتساب مكافأة المهمة؟',
      a: 'تأكد من: 1) إكمال العداد التنازلي كاملاً دون إغلاق الصفحة، 2) إدخال رمز التحقق الصحيح للمهمة، 3) عدم تجاوز الحد اليومي للمهمة، 4) عدم تشغيل أي مانع إعلانات (AdBlocker) قد يعطل أكواد التحقق.'
    },
    {
      q: 'ما هي عقوبة استخدام الـ VPN أو إنشاء أكثر من حساب؟',
      a: 'يتم رصد استخدام الـ VPN والبروكسي والحسابات الوهمية تلقائياً بنظام Fraud Detection. عند الرصد، يتم تجميد الحساب وإلغاء أي أرباح وسحوبات معلقة بشكل نهائي وغير قابل للاسترجاع.'
    },
    {
      q: 'هل يمكنني إحالة نفسي بحساب آخر؟',
      a: 'ممنوع منعاً باتاً. النظام يكتشف عناوين الـ IP المتطابقة والبصمات الرقمية للأجهزة، وسيتم حظر كلا الحسابين فوراً.'
    },
    {
      q: 'كيف أصل إلى المستوى الماسي (Diamond)؟',
      a: 'المستوى الماسي يتطلب جمع 50,000 نقطة. يمنحك 2.0x مضاعف على كل مهمة، و20% عمولة إحالة، وحد يومي يصل إلى 100 مهمة يومياً.'
    }
  ];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSubject('');
      setMessage('');
      success('تم إرسال رسالتك لفريق الدعم الفني بنجاح! سنرد عليك عبر البريد قريباً.');
    }, 1000);
  };

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-black text-white">مركز المساعدة والدعم الفني</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          دليلك الشامل لاستخدام منصة SmartEarn بأمان وتحقيق أقصى استفادة ممكنة.
        </p>
      </div>

      {/* Anti-Fraud Warning Box */}
      <div className="p-6 rounded-3xl bg-rose-950/20 border border-rose-500/30 space-y-3">
        <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>إرشادات الأمان والنزاهة (مهم جداً لتجنب الحظر)</span>
        </div>
        <ul className="text-xs text-rose-200/80 space-y-1.5 list-disc list-inside leading-relaxed">
          <li>يُحظر منعاً باتاً استخدام برامج الـ VPN أو البروكسي عند تنفيذ المهام.</li>
          <li>يُمنع إنشاء أكثر من حساب لنفس الشخص على نفس الهاتف أو الراوتر.</li>
          <li>يُمنع استخدام روبوتات أو برمجيات الإكمال التلقائي.</li>
          <li>أي تلاعب في كود الإحالة أو محاولة إحالة النفس يؤدي لحظر فوري.</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FAQs Accordion (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-white">الأسئلة الشائعة</h2>
          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-right flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-200 hover:text-white"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-emerald-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/80 pt-2.5">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact Form (1 col) */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">تواصل مع الدعم</h2>
          <form onSubmit={handleSendMessage} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">موضوع الرسالة</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="مثال: استفسار بخصوص طلب سحب"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3 text-xs text-slate-100 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">نص الرسالة</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="اكتب تفاصيل استفسارك هنا..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3 text-xs text-slate-100 outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? 'جارِ الإرسال...' : 'إرسال الرسالة'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
