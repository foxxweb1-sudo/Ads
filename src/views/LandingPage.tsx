import React, { useState } from 'react';
import { 
  Zap, 
  ArrowLeft, 
  CheckCircle2, 
  TrendingUp, 
  ShieldCheck, 
  Users, 
  Gift, 
  Sparkles, 
  Coins, 
  Wallet, 
  Smartphone, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Award, 
  Star,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { PublicNav, Footer } from '../components/PublicNav';
import { DEFAULT_LEVELS } from '../lib/constants';

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [calculatorPoints, setCalculatorPoints] = useState<number>(5000);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const estimatedEGP = (calculatorPoints / 100).toFixed(2);

  const faqs = [
    {
      q: 'كيف يمكنني البدء في الربح من المنصة؟',
      a: 'الأمر بسيط جداً: أنشئ حساباً مجانياً في دقيقة واحدة، ادخل إلى صفحة "سوق المهام"، اختر المهمة التي تفضلها (تصفح، استطلاع، عروض، مشاركة اجتماعية)، نفذها واستلم النقاط فوراً في محفظتك.'
    },
    {
      q: 'ما هو الحد الأدنى لسحب الأرباح وما هي الطرق المتاحة؟',
      a: 'الحد الأدنى للسحب هو 50 جنيهاً مصرياً فقط! نوفر طرق دفع متعددة تشمل المحافظ الإلكترونية (فودافون كاش، أورنج كاش، اتصالات كاش)، انستاباي (InstaPay)، التحويل البنكي، والعملات الرقمية (USDT).'
    },
    {
      q: 'كيف يعمل برنامج الإحالات ودعوة الأصدقاء؟',
      a: 'تحصل على كود ورابط إحالة خاص بك بمجرد التسجيل. عندما يسجل أي صديق عبر رابطك، تحصل على عمولة تبدأ من 5% وتصل إلى 20% (حسب مستواك) من أرباح جميع مهامه مدى الحياة دون أن ينقص من أرباحه أي شيء!'
    },
    {
      q: 'ما هي مستويات الحساب وكيف أصل إلى مستوى أعلى؟',
      a: 'كلما أكملت مهاماً أكثر وجمعت نقاطاً، ترتقي تلقائياً بين 5 مستويات (برونزي، فضي، ذهبي، بلاتيني، ماسي). كل مستوى يمنحك مضاعف أرباح أعلى على كل مهمة ونسبة عمولة إحالة أكبر.'
    },
    {
      q: 'هل استخدام VPN أو البروكسي مسموح به؟',
      a: 'لا، المنصة تطبق نظام حماية متطور لكشف الـ VPN والبروكسي والحسابات المتعددة. أي محاولة تلاعب تؤدي إلى تجميد الحساب فوراً لحماية المعلنين والمستخدمين الصادقين.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      <PublicNav onNavigate={onNavigate} />

      <main className="flex-1 pt-20">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden py-20 lg:py-28 px-4 sm:px-6 lg:px-8 border-b border-slate-900">
          {/* Subtle Background Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-10 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs sm:text-sm font-bold animate-pulse">
              <Sparkles className="w-4 h-4" />
              <span>المنصة الأولى عربياً للمهام الذكية والسحب اللحظي</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.15]">
              اكسب من تنفيذ المهام <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                وابنِ دخلك خطوة بخطوة
              </span>
            </h1>

            <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
              منصة متكاملة تتيح لك إنجاز مهام رقمية خفيفة، تصفح روابط معتمدة، تجربة التطبيقات، وجمع النقاط لتحويلها فوراً إلى أموال حقيقية عبر فودافون كاش وانستاباي.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={() => onNavigate('/register')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-base sm:text-lg shadow-xl shadow-emerald-900/40 hover:scale-105 transition-all flex items-center justify-center gap-3"
              >
                <span>ابدأ الآن مجاناً</span>
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => onNavigate('/login')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-base transition-colors flex items-center justify-center gap-2"
              >
                <span>تسجيل الدخول</span>
              </button>
            </div>

            {/* Live Trust Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 border-t border-slate-900/80 max-w-4xl mx-auto">
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80">
                <div className="text-2xl sm:text-3xl font-black text-emerald-400">12,500+</div>
                <div className="text-xs text-slate-400 mt-1">مستخدم نشط يومياً</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80">
                <div className="text-2xl sm:text-3xl font-black text-teal-400">85,000+</div>
                <div className="text-xs text-slate-400 mt-1">مهمة مكتملة بنجاح</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80">
                <div className="text-2xl sm:text-3xl font-black text-cyan-400">250,000+ ج.م</div>
                <div className="text-xs text-slate-400 mt-1">إجمالي الأرباح المسحوبة</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80">
                <div className="text-2xl sm:text-3xl font-black text-purple-400">100%</div>
                <div className="text-xs text-slate-400 mt-1">سحب موثوق ومضمون</div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">خطوات بسيطة وسريعة</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">كيف تبدأ رحلة ربحك في SmartEarn؟</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              ثلاث خطوات تفصلك عن كسب أول دخل رقمي لك وسحبه إلى محفظتك في نفس اليوم.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition-all group relative overflow-hidden">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xl mb-6 group-hover:scale-110 transition-transform">
                1
              </div>
              <h3 className="text-lg font-bold text-white mb-2">أنشئ حسابك المجاني</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                سجل باستخدام بريدك الإلكتروني أو بضغطة زر واحدة عبر Google، واحصل على بونص ترحيبي ونقاط مجانية.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition-all group relative overflow-hidden">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-black text-xl mb-6 group-hover:scale-110 transition-transform">
                2
              </div>
              <h3 className="text-lg font-bold text-white mb-2">اختر ونفّذ المهام اليومية</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                تصفح مئات المهام المتجددة يومياً: زيارة مواقع، استطلاعات رأي، مهام سوشيال، وتطبيقات Partner Offerwall.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition-all group relative overflow-hidden">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-black text-xl mb-6 group-hover:scale-110 transition-transform">
                3
              </div>
              <h3 className="text-lg font-bold text-white mb-2">اسحب أرباحك فوراً</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                حوّل نقاطك إلى جنيهات واطلب السحب المباشر إلى محفظة فودافون كاش، انستاباي، أو حسابك البنكي.
              </p>
            </div>
          </div>
        </section>

        {/* TASK TYPES SHOWCASE */}
        <section id="tasks-preview" className="py-20 bg-slate-900/40 border-y border-slate-900 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">تنوع لا نهائي من العروض</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">أنواع المهام المتاحة على المنصة</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                مهام مصممة لتناسب وقتك وخبرتك مع نظام تحقق إلكتروني دقيق ومكافآت فورية.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Website Visit', nameAr: 'تصفح المواقع', desc: 'تصفح مقالات ومواقع إخبارية وتقنية لبضع ثوانٍ واكسب نقاطاً سريعة.', icon: '🌐', color: 'from-blue-500/20 to-cyan-500/10' },
                { title: 'Surveys', nameAr: 'استطلاعات الرأي', desc: 'أجب عن أسئلة استطلاعية قصيرة حول المنتجات والخدمات للحصول على مكافآت عالية.', icon: '📝', color: 'from-emerald-500/20 to-teal-500/10' },
                { title: 'External Offers', nameAr: 'عروض وتطبيقات', desc: 'تثبيت تطبيقات وتجربتها عبر شبكات العروض المعتمدة والـ Offerwalls.', icon: '📱', color: 'from-purple-500/20 to-pink-500/10' },
                { title: 'Social Tasks', nameAr: 'مهام التواصل', desc: 'متابعة قنوات، الإعجاب بالمنشورات، والمشاركة في مجتمعاتنا الرسمية.', icon: '💬', color: 'from-amber-500/20 to-orange-500/10' },
                { title: 'SmartLink', nameAr: 'روابط ذكية', desc: 'استكشاف صفحات دعائية معتمدة دون إجبار وبطريقة مطابقة لسياسات الشبكات.', icon: '🔗', color: 'from-indigo-500/20 to-blue-500/10' },
                { title: 'Custom Tasks', nameAr: 'مهام مخصصة', desc: 'كتابة مراجعات، تجارب مستخدم، وتقييم خدمات مع مكافآت مضاعفة.', icon: '⭐', color: 'from-yellow-500/20 to-amber-500/10' },
                { title: 'Referral Rewards', nameAr: 'أرباح الإحالة', desc: 'دعوة الأصدقاء والحصول على عمولة مستمرة من جميع مهامهم مدى الحياة.', icon: '🤝', color: 'from-teal-500/20 to-emerald-500/10' },
                { title: 'Daily Streaks', nameAr: 'بونص يومي', desc: 'مكافآت تسجيل دخول يومي وجوائز للمستخدمين الأكثر نشاطاً.', icon: '🎁', color: 'from-rose-500/20 to-pink-500/10' },
              ].map((task, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all hover:-translate-y-1 space-y-3"
                >
                  <div className="text-3xl mb-2">{task.icon}</div>
                  <h3 className="text-base font-bold text-white">{task.nameAr}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{task.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* LEVELS SECTION */}
        <section id="levels" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">نظام الترقيات والولاء</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">ارتقِ بمستواك وضاعف أرباحك</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              كل نقطة تجمعها تقربك من المستوى التالي. كلما ارتفع مستواك، زادت مكافآت مهامك ونسبة عمولة إحالاتك!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.values(DEFAULT_LEVELS).map((lvl) => (
              <div
                key={lvl.id}
                className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${lvl.badgeColor}`}>
                      {lvl.nameAr}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">{lvl.minPoints.toLocaleString()} نقطة</span>
                  </div>

                  <div>
                    <div className="text-2xl font-black text-white">x{lvl.taskMultiplier}</div>
                    <div className="text-xs text-slate-400">مضاعف أرباح المهام</div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>عمولة الإحالة:</span>
                      <span className="font-bold text-emerald-400">{lvl.referralPercentage}%</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>الحد اليومي للمهام:</span>
                      <span className="font-bold text-slate-200">{lvl.dailyTaskLimit} مهمة</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* POINTS & REFERRAL CALCULATOR */}
        <section id="referrals" className="py-20 bg-slate-900/40 border-y border-slate-900 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">حاسبة الأرباح التقديرية</span>
                <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                  احسب كم يمكنك أن تكسب يومياً
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  مع SmartEarn كل 1000 نقطة تساوي 10 جنيهات مصرية قابلة للسحب الفوري. استخدم المؤشر لمعرفة دخلك التقديري.
                </p>

                <div className="space-y-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span>عدد النقاط المتوقع جمعها:</span>
                    <span className="text-emerald-400 text-base">{calculatorPoints.toLocaleString()} نقطة</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="50000"
                    step="500"
                    value={calculatorPoints}
                    onChange={(e) => setCalculatorPoints(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>500 نقطة (5 ج.م)</span>
                    <span>25,000 نقطة (250 ج.م)</span>
                    <span>50,000 نقطة (500 ج.م)</span>
                  </div>
                </div>
              </div>

              {/* Calculator Output Card */}
              <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 shadow-2xl relative overflow-hidden space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Coins className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">القيمة النقدية المباشرة</div>
                      <div className="text-xl font-bold text-white">الرصيد القابل للسحب</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl sm:text-4xl font-black text-emerald-400">{estimatedEGP}</div>
                    <div className="text-xs font-bold text-slate-300">جنيه مصري (EGP)</div>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>سحب فوري بدون شروط تعجيزية</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>عمولات إحالة إضافية تصل إلى 20%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>سحب متاح 24/7 طوال أيام الأسبوع</span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('/register')}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/40 transition-all text-center"
                >
                  سجل الآن وابدأ في جمع النقاط
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* PAYMENT METHODS BANNER */}
        <section id="payment-methods" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-12">
          <div className="max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">سحب أرباح فوري ومحلي</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">طرق سحب متنوعة تناسب الجميع</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              استلم أموالك في أقل من 24 ساعة عبر أشهر وسائل الدفع في مصر والعالم العربي.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: 'فودافون كاش', sub: 'Vodafone Cash', icon: '📱' },
              { name: 'انستاباي', sub: 'InstaPay IPA', icon: '⚡' },
              { name: 'أورنج كاش', sub: 'Orange Cash', icon: '📱' },
              { name: 'اتصالات كاش', sub: 'e& Cash', icon: '📱' },
              { name: 'تحويل بنكي', sub: 'جميع البنوك المصرية', icon: '🏛️' },
              { name: 'USDT Crypto', sub: 'Binance Pay / TRC20', icon: '💎' }
            ].map((p, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/30 transition-all flex flex-col items-center justify-center text-center space-y-2"
              >
                <div className="text-3xl">{p.icon}</div>
                <div className="font-bold text-sm text-white">{p.name}</div>
                <div className="text-[11px] text-slate-400">{p.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ ACCORDION */}
        <section id="faq" className="py-20 bg-slate-900/40 border-t border-slate-900 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">إجابات واضحة</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white">الأسئلة الأكثر شيوعاً</h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = activeFaq === index;
                return (
                  <div
                    key={index}
                    className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : index)}
                      className="w-full p-5 text-right flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-200 hover:text-white"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? (
                        <ChevronUp className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/30 p-8 sm:p-14 text-center space-y-6 relative overflow-hidden shadow-2xl">
            <h2 className="text-3xl sm:text-5xl font-black text-white">
              جاهز لبدء تحقيق أرباحك اليوم؟
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              انضم إلى آلاف المستخدمين الذين يحققون دخلاً إضافياً يومياً. التسجيل مجاني ولا يستغرق سوى دقيقة واحدة.
            </p>
            <button
              onClick={() => onNavigate('/register')}
              className="px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base shadow-xl shadow-emerald-950 hover:scale-105 transition-all inline-flex items-center gap-2"
            >
              <span>إنشاء حساب والبدء فوراً</span>
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        </section>
      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};
