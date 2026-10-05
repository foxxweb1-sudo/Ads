export type UserRole = 'user' | 'admin' | 'superadmin';
export type AccountStatus = 'active' | 'suspended' | 'banned' | 'under_review';
export type UserLevelId = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  email: string;
  photoURL?: string;
  referralCode: string;
  referredBy?: string | null;
  balance: number; // in platform currency (e.g. EGP)
  points: number;
  totalEarned: number;
  totalWithdrawn: number;
  referralEarnings: number;
  level: UserLevelId;
  completedTasks: number;
  successfulReferrals: number;
  accountStatus: AccountStatus;
  role: UserRole;
  createdAt: number;
  lastLoginAt: number;
  lastActiveAt: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface UserPresence {
  uid: string;
  displayName?: string;
  email?: string;
  state: 'online' | 'offline';
  lastChanged: number;
  lastSeen: number;
  currentSession?: string;
  device?: string;
  browser?: string;
}

export type TaskCategory = 
  | 'SmartLink'
  | 'Website Visit'
  | 'Offer'
  | 'Survey'
  | 'App Task'
  | 'Social Task'
  | 'Custom Task'
  | 'External Offer';

export type TaskStatus = 'Active' | 'Paused' | 'Disabled';
export type VerificationType = 'timer' | 'code' | 'proof_url' | 'instant';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  url: string;
  rewardAmount: number; // EGP
  rewardPoints: number;
  estimatedMinutes: number;
  requiredLevel: UserLevelId;
  dailyLimit: number; // max completions per user per day
  globalLimit: number; // total completions allowed platform-wide (0 for unlimited)
  cooldownMinutes: number; // cooldown between completions for same user
  completionsCount: number;
  status: TaskStatus;
  icon?: string;
  instructions?: string;
  verificationType: VerificationType;
  verificationTimerSeconds?: number;
  codeAnswer?: string;
  badge?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface TaskCompletion {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  taskId: string;
  taskTitle: string;
  taskCategory: TaskCategory;
  rewardAmount: number;
  rewardPoints: number;
  status: 'completed' | 'pending_review' | 'rejected';
  timestamp: number;
  proofUrl?: string;
  codeSubmitted?: string;
  ipAddress?: string;
}

export type TransactionType =
  | 'Task Reward'
  | 'Referral Reward'
  | 'Withdrawal'
  | 'Adjustment'
  | 'Bonus'
  | 'Refund';

export interface Transaction {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  type: TransactionType;
  amount: number; // positive or negative
  points?: number;
  description: string;
  timestamp: number;
  status: 'completed' | 'pending' | 'rejected' | 'refunded';
  referenceId?: string;
  balanceAfter?: number;
}

export type WithdrawalStatus = 'Pending' | 'Processing' | 'Paid' | 'Rejected' | 'Cancelled';

export interface Withdrawal {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  fee: number;
  netAmount: number;
  paymentMethodId: string;
  paymentMethodName: string;
  paymentDetails: Record<string, string>; // e.g., phone: "010xxxxxxxx", accountName: "..."
  status: WithdrawalStatus;
  createdAt: number;
  processedAt?: number;
  adminNote?: string;
  txHashOrRef?: string;
}

export interface LevelConfig {
  id: UserLevelId;
  name: string;
  nameAr: string;
  minPoints: number;
  taskMultiplier: number; // e.g. 1.0, 1.15, 1.30, etc.
  referralPercentage: number; // e.g. 5, 8, 12, 15, 20
  dailyTaskLimit: number;
  badgeColor: string;
  badgeBg: string;
  icon: string;
}

export interface PaymentMethodField {
  key: string;
  labelAr: string;
  placeholderAr: string;
  type: 'text' | 'number' | 'email';
  required: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  fields: PaymentMethodField[];
  minimumAmount: number;
  maximumAmount: number;
  feePercentage: number;
  status: 'active' | 'inactive';
  instructionsAr?: string;
}

export interface PlatformSettings {
  siteName: string;
  logoUrl?: string;
  currency: string;
  currencySymbol: string;
  pointsPerCurrencyUnit: number; // e.g. 1000 points = 10 EGP (so 100 points = 1 EGP => pointsPerCurrencyUnit = 100)
  minWithdrawal: number;
  maxWithdrawal: number;
  defaultReferralPercentage: number;
  dailyTaskLimit: number;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  supportEmail: string;
  supportTelegram?: string;
  termsNotice?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'task' | 'withdrawal' | 'level' | 'referral' | 'system' | 'security';
  isRead: boolean;
  createdAt: number;
  link?: string;
}

export interface LoginLog {
  id: string;
  userId: string;
  email: string;
  status: 'Successful Login' | 'Failed Login' | 'Logout' | 'Password Reset' | 'Session Revoked';
  timestamp: number;
  device: string;
  browser: string;
  os: string;
  ip: string;
  userAgent?: string;
}

export interface ActivityLog {
  id: string;
  actorId: string;
  actorEmail?: string;
  targetUserId?: string;
  action: string;
  description: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface FraudAlert {
  id: string;
  userId: string;
  email: string;
  riskLevel: 'Normal' | 'Suspicious' | 'High Risk' | 'Blocked';
  reason: string;
  detectionCount: number;
  createdAt: number;
  updatedAt: number;
  details?: Record<string, any>;
}

export interface LoginVerification {
  id: string;
  uid: string;
  email: string;
  code: string;
  expiresAt: number;
  createdAt: number;
  verified: boolean;
  device?: string;
  browser?: string;
  ip?: string;
}
