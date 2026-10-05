import { LevelConfig, PaymentMethod, PlatformSettings, Task } from '../types';

export const DEFAULT_SETTINGS: PlatformSettings = {
  siteName: 'SmartEarn',
  logoUrl: '',
  currency: 'EGP',
  currencySymbol: 'ج.م',
  pointsPerCurrencyUnit: 100, // 100 Points = 1 EGP (1,000 Points = 10 EGP)
  minWithdrawal: 50,
  maxWithdrawal: 10000,
  defaultReferralPercentage: 5,
  dailyTaskLimit: 20,
  maintenanceMode: false,
  registrationEnabled: true,
  supportEmail: 'support@smartearn.com',
  supportTelegram: '@SmartEarnSupport',
  termsNotice: 'تنبيه: يُحظر استخدام الـ VPN أو البروكسي أو إنشاء حسابات وهمية، وسيتم حظر أي حساب مخالف فوراً.'
};

export const DEFAULT_LEVELS: Record<string, LevelConfig> = {
  Bronze: {
    id: 'Bronze',
    name: 'Bronze',
    nameAr: 'برونزي',
    minPoints: 0,
    taskMultiplier: 1.0,
    referralPercentage: 5,
    dailyTaskLimit: 10,
    badgeColor: 'text-amber-600 border-amber-600/30 bg-amber-600/10',
    badgeBg: 'from-amber-700/20 to-amber-900/20',
    icon: 'Shield'
  },
  Silver: {
    id: 'Silver',
    name: 'Silver',
    nameAr: 'فضي',
    minPoints: 1000,
    taskMultiplier: 1.1,
    referralPercentage: 7,
    dailyTaskLimit: 15,
    badgeColor: 'text-slate-300 border-slate-400/30 bg-slate-400/10',
    badgeBg: 'from-slate-600/20 to-slate-800/20',
    icon: 'Award'
  },
  Gold: {
    id: 'Gold',
    name: 'Gold',
    nameAr: 'ذهبي',
    minPoints: 5000,
    taskMultiplier: 1.25,
    referralPercentage: 10,
    dailyTaskLimit: 25,
    badgeColor: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
    badgeBg: 'from-yellow-600/20 to-amber-600/20',
    icon: 'Crown'
  },
  Platinum: {
    id: 'Platinum',
    name: 'Platinum',
    nameAr: 'بلاتيني',
    minPoints: 15000,
    taskMultiplier: 1.5,
    referralPercentage: 15,
    dailyTaskLimit: 40,
    badgeColor: 'text-cyan-300 border-cyan-400/30 bg-cyan-400/10',
    badgeBg: 'from-cyan-600/20 to-blue-700/20',
    icon: 'Sparkles'
  },
  Diamond: {
    id: 'Diamond',
    name: 'Diamond',
    nameAr: 'ماسي',
    minPoints: 50000,
    taskMultiplier: 2.0,
    referralPercentage: 20,
    dailyTaskLimit: 100,
    badgeColor: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    badgeBg: 'from-purple-600/20 to-indigo-700/20',
    icon: 'Gem'
  }
};

export const DEFAULT_PAYMENT_METHODS: Record<string, PaymentMethod> = {
  vodafone_cash: {
    id: 'vodafone_cash',
    name: 'Vodafone Cash',
    nameAr: 'فودافون كاش',
    icon: 'Smartphone',
    minimumAmount: 50,
    maximumAmount: 10000,
    feePercentage: 0,
    status: 'active',
    instructionsAr: 'أدخل رقم محفظة فودافون كاش المكون من 11 رقماً بدقة.',
    fields: [
      {
        key: 'wallet_number',
        labelAr: 'رقم محفظة فودافون كاش',
        placeholderAr: '010XXXXXXXX',
        type: 'text',
        required: true
      },
      {
        key: 'account_owner',
        labelAr: 'اسم صاحب المحفظة',
        placeholderAr: 'الاسم ثلاثي',
        type: 'text',
        required: false
      }
    ]
  },
  instapay: {
    id: 'instapay',
    name: 'InstaPay',
    nameAr: 'انستاباي (InstaPay)',
    icon: 'Zap',
    minimumAmount: 50,
    maximumAmount: 20000,
    feePercentage: 0,
    status: 'active',
    instructionsAr: 'أدخل عنوان الدفع اللحظي (IPA) مثل username@instapay أو رقم الهاتف المسجل.',
    fields: [
      {
        key: 'ipa_address',
        labelAr: 'عنوان الدفع اللحظي (IPA) أو رقم الموبايل',
        placeholderAr: 'example@instapay أو 010XXXXXXXX',
        type: 'text',
        required: true
      },
      {
        key: 'account_owner',
        labelAr: 'اسم المستلم في انستاباي',
        placeholderAr: 'الاسم كما يظهر في التطبيق',
        type: 'text',
        required: true
      }
    ]
  },
  orange_cash: {
    id: 'orange_cash',
    name: 'Orange Cash',
    nameAr: 'أورنج كاش',
    icon: 'Smartphone',
    minimumAmount: 50,
    maximumAmount: 10000,
    feePercentage: 0,
    status: 'active',
    instructionsAr: 'أدخل رقم محفظة أورنج كاش للتلقي الفوري.',
    fields: [
      {
        key: 'wallet_number',
        labelAr: 'رقم محفظة أورنج كاش',
        placeholderAr: '012XXXXXXXX',
        type: 'text',
        required: true
      }
    ]
  },
  etisalat_cash: {
    id: 'etisalat_cash',
    name: 'e& Cash (Etisalat)',
    nameAr: 'اتصالات كاش (e&)',
    icon: 'Smartphone',
    minimumAmount: 50,
    maximumAmount: 10000,
    feePercentage: 0,
    status: 'active',
    instructionsAr: 'أدخل رقم محفظة اتصالات كاش لاستلام الأرباح.',
    fields: [
      {
        key: 'wallet_number',
        labelAr: 'رقم محفظة اتصالات كاش',
        placeholderAr: '011XXXXXXXX',
        type: 'text',
        required: true
      }
    ]
  },
  bank_transfer: {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    nameAr: 'تحويل بنكي محلي',
    icon: 'Building2',
    minimumAmount: 300,
    maximumAmount: 50000,
    feePercentage: 1.5,
    status: 'active',
    instructionsAr: 'تحويل بنكي لحسابك في أي بنك داخل مصر. يستغرق المعالجة من 24 إلى 48 ساعة عمل.',
    fields: [
      {
        key: 'bank_name',
        labelAr: 'اسم البنك',
        placeholderAr: 'مثال: البنك الأهلي المصري / بنك مصر / CIB',
        type: 'text',
        required: true
      },
      {
        key: 'account_name',
        labelAr: 'اسم صاحب الحساب بالكامل',
        placeholderAr: 'الاسم الرباعي باللغة الإنجليزية أو العربية',
        type: 'text',
        required: true
      },
      {
        key: 'account_or_iban',
        labelAr: 'رقم الحساب البنكي أو رقم IBAN',
        placeholderAr: 'EGXXXXXXXXXXXXXXXXXXXXXXXXX',
        type: 'text',
        required: true
      }
    ]
  },
  usdt_crypto: {
    id: 'usdt_crypto',
    name: 'USDT (TRC20 / Binance Pay)',
    nameAr: 'دولار رقمي USDT / Binance Pay',
    icon: 'Coins',
    minimumAmount: 250, // in EGP equivalent
    maximumAmount: 100000,
    feePercentage: 2,
    status: 'active',
    instructionsAr: 'أدخل معرف Binance Pay ID الخاص بك أو عنوان محفظة USDT (TRC-20).',
    fields: [
      {
        key: 'crypto_address',
        labelAr: 'عنوان المحفظة (TRC20) أو Binance Pay ID',
        placeholderAr: 'T... أو Binance ID (8-9 أرقام)',
        type: 'text',
        required: true
      }
    ]
  }
};

export const INITIAL_TASKS: Omit<Task, 'id'>[] = [
  {
    title: 'تصفح موقع أخباري تقني وقراءة المقال',
    description: 'قم بزيارة الموقع، تصفح المقال لمدة 60 ثانية، واضغط على التحقق للحصول على المكافأة فوراً.',
    category: 'Website Visit',
    url: 'https://news.ycombinator.com',
    rewardAmount: 2.5,
    rewardPoints: 250,
    estimatedMinutes: 1,
    requiredLevel: 'Bronze',
    dailyLimit: 3,
    globalLimit: 1000,
    cooldownMinutes: 120,
    completionsCount: 42,
    status: 'Active',
    verificationType: 'timer',
    verificationTimerSeconds: 45,
    badge: 'سهل وسريع',
    instructions: '1. اضغط على زر ابدأ المهمة.\n2. انتظر انتهاء العداد التنازلي (45 ثانية).\n3. تأكد من البقاء في الصفحة.\n4. اضغط تأكيد واستلم مكافأتك فوراً.',
    createdAt: Date.now() - 86400000 * 3
  },
  {
    title: 'متابعة حساب المنصة الرسمي على تليجرام',
    description: 'انضم إلى قناة التليجرام الرسمية للحصول على أحدث أكواد البونص والعروض اليومية الحصرية.',
    category: 'Social Task',
    url: 'https://telegram.org',
    rewardAmount: 5.0,
    rewardPoints: 500,
    estimatedMinutes: 2,
    requiredLevel: 'Bronze',
    dailyLimit: 1,
    globalLimit: 5000,
    cooldownMinutes: 1440,
    completionsCount: 184,
    status: 'Active',
    verificationType: 'proof_url',
    badge: 'مكافأة مميزة',
    instructions: '1. انضم للقناة الرسمية على تليجرام.\n2. التقط لقطة شاشة أو أدخل اسم المستخدم الخاص بك (@username).\n3. اضغط إرسال للتحقق.',
    createdAt: Date.now() - 86400000 * 2
  },
  {
    title: 'استطلاع رأي قصير حول تجربة التسوق الرقمي',
    description: 'أجب عن 5 أسئلة استطلاعية بسيطة حول عادات التسوق عبر الإنترنت لمساعدة الباحثين.',
    category: 'Survey',
    url: 'https://google.com/forms',
    rewardAmount: 8.0,
    rewardPoints: 800,
    estimatedMinutes: 3,
    requiredLevel: 'Bronze',
    dailyLimit: 2,
    globalLimit: 800,
    cooldownMinutes: 360,
    completionsCount: 96,
    status: 'Active',
    verificationType: 'code',
    codeAnswer: 'SMART2026',
    badge: 'مكافأة مرتفعة',
    instructions: '1. ادخل إلى الاستطلاع وأجب بصدق.\n2. في نهاية الاستطلاع ستجد رمز التأكيد (SMART2026).\n3. اكتب الرمز هنا للحصول على المكافأة فوراً.',
    createdAt: Date.now() - 86400000 * 4
  },
  {
    title: 'مهمة سمارت لينك الإعلاني المعتمد',
    description: 'تخطي الرابط المختصر الذكي واستكشاف الصفحة الترويجية للحصول على نقاط فورية.',
    category: 'SmartLink',
    url: 'https://example.com/smartlink',
    rewardAmount: 1.5,
    rewardPoints: 150,
    estimatedMinutes: 1,
    requiredLevel: 'Bronze',
    dailyLimit: 5,
    globalLimit: 2500,
    cooldownMinutes: 60,
    completionsCount: 310,
    status: 'Active',
    verificationType: 'timer',
    verificationTimerSeconds: 30,
    instructions: '1. اضغط على الرابط وانتظر تحميل الصفحة.\n2. انتظر 30 ثانية في الصفحة.\n3. اضغط زر التحقق لحساب النقاط.',
    createdAt: Date.now() - 86400000 * 5
  },
  {
    title: 'تثبيت وتجربة تطبيق الإنتاجية (Offerwall Partner)',
    description: 'قم بتنزيل التطبيق التجريبي وفتحه لمدة دقيقة واحدة للحصول على مكافأة المستوى الفضي والذهبي.',
    category: 'External Offer',
    url: 'https://play.google.com',
    rewardAmount: 15.0,
    rewardPoints: 1500,
    estimatedMinutes: 5,
    requiredLevel: 'Silver',
    dailyLimit: 1,
    globalLimit: 300,
    cooldownMinutes: 1440,
    completionsCount: 28,
    status: 'Active',
    verificationType: 'proof_url',
    badge: 'حصري للمستوى الفضي+',
    instructions: '1. حمّل التطبيق من متجر Google Play.\n2. افتح التطبيق وسجل كزائر.\n3. التقط صورة تثبت فتح التطبيق وأرفق الرابط.',
    createdAt: Date.now() - 86400000 * 1
  },
  {
    title: 'مهمة مخصصة: كتابة مراجعة إيجابية للمنصة',
    description: 'شارك تجربتك مع المنصة على منصات المراجعات المستقلة لدعم المجتمع.',
    category: 'Custom Task',
    url: 'https://trustpilot.com',
    rewardAmount: 20.0,
    rewardPoints: 2000,
    estimatedMinutes: 4,
    requiredLevel: 'Gold',
    dailyLimit: 1,
    globalLimit: 150,
    cooldownMinutes: 10080,
    completionsCount: 15,
    status: 'Active',
    verificationType: 'proof_url',
    badge: 'مستوى ذهبي',
    instructions: '1. اكتب مراجعة صادقة.\n2. أرفق رابط المراجعة أو لقطة شاشة للتحقق.',
    createdAt: Date.now() - 86400000 * 6
  }
];
