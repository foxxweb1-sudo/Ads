import { 
  ref, 
  get, 
  set, 
  update, 
  push, 
  runTransaction, 
  query, 
  orderByChild, 
  equalTo, 
  limitToLast,
  onValue,
  serverTimestamp
} from 'firebase/database';
import { rtdb, dbRefs } from './firebase';
import { 
  UserProfile, 
  Task, 
  TaskCompletion, 
  Transaction, 
  Withdrawal, 
  Notification, 
  LoginLog, 
  ActivityLog, 
  PlatformSettings, 
  LevelConfig, 
  PaymentMethod,
  FraudAlert
} from '../types';
import { DEFAULT_SETTINGS, DEFAULT_LEVELS, DEFAULT_PAYMENT_METHODS, INITIAL_TASKS } from './constants';

// Initialize platform defaults in Realtime Database if empty
export async function initializeDatabaseDefaults() {
  try {
    const settingsSnap = await get(dbRefs.settings());
    if (!settingsSnap.exists()) {
      await set(dbRefs.settings(), DEFAULT_SETTINGS);
    }

    const levelsSnap = await get(dbRefs.levels());
    if (!levelsSnap.exists()) {
      await set(dbRefs.levels(), DEFAULT_LEVELS);
    }

    const paymentMethodsSnap = await get(dbRefs.paymentMethods());
    if (!paymentMethodsSnap.exists()) {
      await set(dbRefs.paymentMethods(), DEFAULT_PAYMENT_METHODS);
    }

    const tasksSnap = await get(dbRefs.tasks());
    if (!tasksSnap.exists()) {
      const initialTasksMap: Record<string, Task> = {};
      INITIAL_TASKS.forEach((t) => {
        const newRef = push(dbRefs.tasks());
        if (newRef.key) {
          initialTasksMap[newRef.key] = {
            ...t,
            id: newRef.key
          };
        }
      });
      if (Object.keys(initialTasksMap).length > 0) {
        await set(dbRefs.tasks(), initialTasksMap);
      }
    }
  } catch (error) {
    console.error('Error initializing database defaults:', error);
  }
}

// Activity Logger
export async function logActivity(activity: Omit<ActivityLog, 'id' | 'timestamp'>) {
  try {
    const newRef = push(dbRefs.activityLogs());
    const logItem: ActivityLog = {
      id: newRef.key || Date.now().toString(),
      ...activity,
      timestamp: Date.now()
    };
    await set(newRef, logItem);
  } catch (err) {
    console.warn('Failed to log activity:', err);
  }
}

// Login Logger
export async function recordLoginLog(log: Omit<LoginLog, 'id' | 'timestamp'>) {
  try {
    const newRef = push(dbRefs.loginLogs());
    const logItem: LoginLog = {
      id: newRef.key || Date.now().toString(),
      ...log,
      timestamp: Date.now()
    };
    await set(newRef, logItem);
  } catch (err) {
    console.warn('Failed to record login log:', err);
  }
}

// Send Notification to user
export async function sendNotification(
  userId: string, 
  title: string, 
  message: string, 
  type: Notification['type'], 
  link?: string
) {
  try {
    const newRef = push(dbRefs.notifications());
    const notification: Notification = {
      id: newRef.key || Date.now().toString(),
      userId,
      title,
      message,
      type,
      isRead: false,
      createdAt: Date.now(),
      link
    };
    await set(newRef, notification);
  } catch (err) {
    console.warn('Failed to send notification:', err);
  }
}

// Check and Update Level according to points
export function determineUserLevel(points: number, levels: Record<string, LevelConfig>): string {
  if (points >= (levels.Diamond?.minPoints || 50000)) return 'Diamond';
  if (points >= (levels.Platinum?.minPoints || 15000)) return 'Platinum';
  if (points >= (levels.Gold?.minPoints || 5000)) return 'Gold';
  if (points >= (levels.Silver?.minPoints || 1000)) return 'Silver';
  return 'Bronze';
}

// Complete a Task safely with multiplier calculation, atomic balance & points update, referral commission payout, and transaction logging
export async function completeTask(
  user: UserProfile, 
  task: Task, 
  proof?: { code?: string; proofUrl?: string }
): Promise<{ success: boolean; message: string; earnedAmount?: number; earnedPoints?: number }> {
  try {
    if (user.accountStatus === 'banned' || user.accountStatus === 'suspended') {
      return { success: false, message: 'حسابك محظور أو موقوف مؤقتاً بسبب مخالفة الشروط، لا يمكن تنفيذ المهام.' };
    }

    if (task.status !== 'Active') {
      return { success: false, message: 'هذه المهمة غير نشطة حالياً.' };
    }

    // Level check
    const levelOrder = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
    const userLevelIdx = levelOrder.indexOf(user.level || 'Bronze');
    const requiredLevelIdx = levelOrder.indexOf(task.requiredLevel || 'Bronze');
    if (userLevelIdx < requiredLevelIdx) {
      return { success: false, message: `هذه المهمة تتطلب مستوى ${task.requiredLevel} أو أعلى.` };
    }

    // Verification code validation if applicable
    if (task.verificationType === 'code' && task.codeAnswer) {
      if (!proof?.code || proof.code.trim().toLowerCase() !== task.codeAnswer.trim().toLowerCase()) {
        return { success: false, message: 'رمز التأكيد غير صحيح. يرجى التحقق وإعادة المحاولة.' };
      }
    }

    // Check user's completion limit for this task today
    const completionsSnap = await get(dbRefs.taskCompletions());
    let userCompletionsToday = 0;
    let lastCompletionTime = 0;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    if (completionsSnap.exists()) {
      const allCompletions: Record<string, TaskCompletion> = completionsSnap.val();
      Object.values(allCompletions).forEach((c) => {
        if (c.userId === user.uid && c.taskId === task.id && c.timestamp > oneDayAgo) {
          userCompletionsToday++;
          if (c.timestamp > lastCompletionTime) {
            lastCompletionTime = c.timestamp;
          }
        }
      });
    }

    if (task.dailyLimit > 0 && userCompletionsToday >= task.dailyLimit) {
      return { success: false, message: `لقد وصلت للحد اليومي لتنفيذ هذه المهمة (${task.dailyLimit} مرات يومياً).` };
    }

    if (task.cooldownMinutes > 0 && lastCompletionTime > 0) {
      const cooldownMs = task.cooldownMinutes * 60 * 1000;
      const timeRemaining = (lastCompletionTime + cooldownMs) - Date.now();
      if (timeRemaining > 0) {
        const minsLeft = Math.ceil(timeRemaining / (60 * 1000));
        return { success: false, message: `يجب الانتظار ${minsLeft} دقيقة قبل تنفيذ هذه المهمة مجدداً.` };
      }
    }

    // Fetch Level configs for multiplier
    const levelsSnap = await get(dbRefs.levels());
    const levels: Record<string, LevelConfig> = levelsSnap.exists() ? levelsSnap.val() : DEFAULT_LEVELS;
    const userLevelConfig = levels[user.level] || DEFAULT_LEVELS.Bronze;
    const multiplier = userLevelConfig.taskMultiplier || 1.0;

    // Calculate earned reward and points
    const finalAmount = Number((task.rewardAmount * multiplier).toFixed(2));
    const finalPoints = Math.round(task.rewardPoints * multiplier);

    // 1. Record Task Completion
    const completionRef = push(dbRefs.taskCompletions());
    const completionData: TaskCompletion = {
      id: completionRef.key || Date.now().toString(),
      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName || user.username,
      taskId: task.id,
      taskTitle: task.title,
      taskCategory: task.category,
      rewardAmount: finalAmount,
      rewardPoints: finalPoints,
      status: 'completed',
      timestamp: Date.now(),
      codeSubmitted: proof?.code,
      proofUrl: proof?.proofUrl
    };
    await set(completionRef, completionData);

    // 2. Increment Task completion count
    const taskRef = dbRefs.task(task.id);
    await update(taskRef, {
      completionsCount: (task.completionsCount || 0) + 1
    });

    // 3. Update User Balance, Points, and Completed Tasks
    const userRef = dbRefs.user(user.uid);
    let newLevel = user.level;
    await runTransaction(userRef, (currentData: UserProfile | null) => {
      if (!currentData) return currentData;
      const updatedPoints = (currentData.points || 0) + finalPoints;
      const updatedBalance = Number(((currentData.balance || 0) + finalAmount).toFixed(2));
      const updatedTotalEarned = Number(((currentData.totalEarned || 0) + finalAmount).toFixed(2));
      const updatedCompletedTasks = (currentData.completedTasks || 0) + 1;
      newLevel = determineUserLevel(updatedPoints, levels) as any;

      return {
        ...currentData,
        points: updatedPoints,
        balance: updatedBalance,
        totalEarned: updatedTotalEarned,
        completedTasks: updatedCompletedTasks,
        level: newLevel,
        lastActiveAt: Date.now()
      };
    });

    // 4. Record Transaction
    const txRef = push(dbRefs.transactions());
    const txData: Transaction = {
      id: txRef.key || Date.now().toString(),
      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName || user.username,
      type: 'Task Reward',
      amount: finalAmount,
      points: finalPoints,
      description: `مكافأة إكمال مهمة: ${task.title} (مستوى ${user.level} x${multiplier})`,
      timestamp: Date.now(),
      status: 'completed',
      referenceId: task.id,
      balanceAfter: Number(((user.balance || 0) + finalAmount).toFixed(2))
    };
    await set(txRef, txData);

    // 5. Send Notification
    await sendNotification(
      user.uid,
      '🎉 تم إكمال المهمة بنجاح!',
      `تمت إضافة ${finalAmount} ج.م و ${finalPoints} نقطة إلى رصيدك مقابل: "${task.title}".`,
      'task'
    );

    // 6. Check Level Up Notification
    if (newLevel !== user.level) {
      await sendNotification(
        user.uid,
        '🚀 ترقية مستوى حسابك!',
        `تهانينا! لقد وصلت إلى المستوى ${levels[newLevel]?.nameAr || newLevel} وحصلت على مضاعف أرباح أعلى!`,
        'level'
      );
    }

    // 7. Referral Commission Payout (if referredBy exists)
    if (user.referredBy) {
      try {
        await processReferralCommission(user.referredBy, user, finalAmount);
      } catch (refErr) {
        console.warn('Referral commission processing note:', refErr);
      }
    }

    // 8. Log Activity
    await logActivity({
      actorId: user.uid,
      actorEmail: user.email,
      action: 'Task Completed',
      description: `أكمل المستخدم المهمة "${task.title}" وحصل على ${finalAmount} ج.م`,
      metadata: { taskId: task.id, finalAmount, finalPoints }
    });

    return {
      success: true,
      message: `تم تنفيذ المهمة بنجاح! ربحت ${finalAmount} ج.م و ${finalPoints} نقطة.`,
      earnedAmount: finalAmount,
      earnedPoints: finalPoints
    };
  } catch (err: any) {
    console.error('Error in completeTask:', err);
    return { success: false, message: err.message || 'حدث خطأ أثناء حفظ تنفيذ المهمة.' };
  }
}

// Process Referral Commission to Referrer
async function processReferralCommission(referralCode: string, referredUser: UserProfile, rewardAmount: number) {
  const usersSnap = await get(dbRefs.users());
  if (!usersSnap.exists()) return;

  const allUsers: Record<string, UserProfile> = usersSnap.val();
  const referrer = Object.values(allUsers).find((u) => u.referralCode === referralCode);

  if (!referrer || referrer.uid === referredUser.uid) return;

  const levelsSnap = await get(dbRefs.levels());
  const levels: Record<string, LevelConfig> = levelsSnap.exists() ? levelsSnap.val() : DEFAULT_LEVELS;
  const referrerLevelConfig = levels[referrer.level] || DEFAULT_LEVELS.Bronze;
  const refPercentage = referrerLevelConfig.referralPercentage || 5;

  const commissionAmount = Number(((rewardAmount * refPercentage) / 100).toFixed(2));
  if (commissionAmount <= 0) return;

  // Credit Referrer
  const referrerRef = dbRefs.user(referrer.uid);
  await runTransaction(referrerRef, (current: UserProfile | null) => {
    if (!current) return current;
    return {
      ...current,
      balance: Number(((current.balance || 0) + commissionAmount).toFixed(2)),
      referralEarnings: Number(((current.referralEarnings || 0) + commissionAmount).toFixed(2)),
      totalEarned: Number(((current.totalEarned || 0) + commissionAmount).toFixed(2))
    };
  });

  // Record Transaction for Referrer
  const txRef = push(dbRefs.transactions());
  const txData: Transaction = {
    id: txRef.key || Date.now().toString(),
    userId: referrer.uid,
    userEmail: referrer.email,
    userName: referrer.displayName || referrer.username,
    type: 'Referral Reward',
    amount: commissionAmount,
    description: `عمولة إحالة بنسبة ${refPercentage}% من نشاط ${referredUser.displayName || referredUser.username}`,
    timestamp: Date.now(),
    status: 'completed',
    referenceId: referredUser.uid
  };
  await set(txRef, txData);

  // Notify Referrer
  await sendNotification(
    referrer.uid,
    '💰 عمولة إحالة جديدة!',
    `حصلت على ${commissionAmount} ج.م عمولة إحالة من نشاط صديقك ${referredUser.displayName || referredUser.username}.`,
    'referral'
  );
}

// Request a Withdrawal
export async function requestWithdrawal(
  user: UserProfile,
  amount: number,
  paymentMethod: PaymentMethod,
  paymentDetails: Record<string, string>,
  settings: PlatformSettings
): Promise<{ success: boolean; message: string }> {
  try {
    if (user.accountStatus !== 'active') {
      return { success: false, message: 'حسابك غير نشط أو تحت المراجعة، لا يمكن طلب السحب حالياً.' };
    }

    if (amount < (paymentMethod.minimumAmount || settings.minWithdrawal || 50)) {
      const min = Math.max(paymentMethod.minimumAmount || 0, settings.minWithdrawal || 50);
      return { success: false, message: `الحد الأدنى للسحب هو ${min} ${settings.currencySymbol || 'ج.م'}.` };
    }

    if (amount > (paymentMethod.maximumAmount || settings.maxWithdrawal || 10000)) {
      const max = Math.min(paymentMethod.maximumAmount || 10000, settings.maxWithdrawal || 10000);
      return { success: false, message: `الحد الأقصى للسحب في المرة الواحدة هو ${max} ${settings.currencySymbol || 'ج.م'}.` };
    }

    if (user.balance < amount) {
      return { success: false, message: 'رصيدك الحالي غير كافٍ لإتمام هذا السحب.' };
    }

    // Validate required fields
    for (const field of paymentMethod.fields) {
      if (field.required && (!paymentDetails[field.key] || !paymentDetails[field.key].trim())) {
        return { success: false, message: `يرجى إدخال حقل "${field.labelAr}".` };
      }
    }

    const fee = Number(((amount * (paymentMethod.feePercentage || 0)) / 100).toFixed(2));
    const netAmount = Number((amount - fee).toFixed(2));

    // Deduct user balance atomically
    const userRef = dbRefs.user(user.uid);
    let deductionSuccessful = false;
    await runTransaction(userRef, (current: UserProfile | null) => {
      if (!current || (current.balance || 0) < amount) {
        return undefined; // abort
      }
      deductionSuccessful = true;
      return {
        ...current,
        balance: Number(((current.balance || 0) - amount).toFixed(2)),
        totalWithdrawn: (current.totalWithdrawn || 0) // will count when paid
      };
    });

    if (!deductionSuccessful) {
      return { success: false, message: 'فشلت عملية خصم الرصيد. تأكد من توفر الرصيد الكافي.' };
    }

    // Create Withdrawal Record
    const withdrawalRef = push(dbRefs.withdrawals());
    const withdrawalId = withdrawalRef.key || Date.now().toString();
    const withdrawalData: Withdrawal = {
      id: withdrawalId,
      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName || user.username,
      amount,
      fee,
      netAmount,
      paymentMethodId: paymentMethod.id,
      paymentMethodName: paymentMethod.nameAr || paymentMethod.name,
      paymentDetails,
      status: 'Pending',
      createdAt: Date.now()
    };
    await set(withdrawalRef, withdrawalData);

    // Create Transaction Record
    const txRef = push(dbRefs.transactions());
    const txData: Transaction = {
      id: txRef.key || Date.now().toString(),
      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName || user.username,
      type: 'Withdrawal',
      amount: -amount,
      description: `طلب سحب عبر ${paymentMethod.nameAr} بقيمة ${amount} ج.م (صافي: ${netAmount} ج.م)`,
      timestamp: Date.now(),
      status: 'pending',
      referenceId: withdrawalId,
      balanceAfter: Number(((user.balance || 0) - amount).toFixed(2))
    };
    await set(txRef, txData);

    // Send Notification
    await sendNotification(
      user.uid,
      '⏳ تم استلام طلب السحب',
      `تم استلام طلب سحب مبلغ ${amount} ج.م عبر ${paymentMethod.nameAr} بنجاح وهو قيد المراجعة.`,
      'withdrawal'
    );

    // Log Activity
    await logActivity({
      actorId: user.uid,
      actorEmail: user.email,
      action: 'Withdrawal Created',
      description: `أنشأ المستخدم طلب سحب بمبلغ ${amount} ج.م عبر ${paymentMethod.nameAr}`,
      metadata: { withdrawalId, amount, netAmount, paymentMethodId: paymentMethod.id }
    });

    return { success: true, message: 'تم إرسال طلب السحب بنجاح! سيتم مراجعته وتحويله قريباً.' };
  } catch (err: any) {
    console.error('Error in requestWithdrawal:', err);
    return { success: false, message: err.message || 'حدث خطأ أثناء معالجة طلب السحب.' };
  }
}

// Admin: Process Withdrawal (Approve, Mark Paid, Reject)
export async function updateWithdrawalStatus(
  adminUser: UserProfile,
  withdrawal: Withdrawal,
  newStatus: 'Paid' | 'Processing' | 'Rejected',
  adminNote?: string,
  txHashOrRef?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const withdrawalRef = dbRefs.withdrawal(withdrawal.id);

    if (newStatus === 'Paid') {
      // Mark as Paid
      await update(withdrawalRef, {
        status: 'Paid',
        processedAt: Date.now(),
        adminNote: adminNote || '',
        txHashOrRef: txHashOrRef || ''
      });

      // Update User totalWithdrawn
      const userRef = dbRefs.user(withdrawal.userId);
      await runTransaction(userRef, (curr: UserProfile | null) => {
        if (!curr) return curr;
        return {
          ...curr,
          totalWithdrawn: Number(((curr.totalWithdrawn || 0) + withdrawal.amount).toFixed(2))
        };
      });

      // Update related transaction
      const txsSnap = await get(dbRefs.transactions());
      if (txsSnap.exists()) {
        const allTxs: Record<string, Transaction> = txsSnap.val();
        const relatedTxKey = Object.keys(allTxs).find((k) => allTxs[k].referenceId === withdrawal.id);
        if (relatedTxKey) {
          await update(dbRefs.transaction(relatedTxKey), { status: 'completed' });
        }
      }

      await sendNotification(
        withdrawal.userId,
        '✅ تم دفع طلب السحب بنجاح!',
        `تم تحويل مبلغ ${withdrawal.netAmount} ج.م إلى حسابك عبر ${withdrawal.paymentMethodName}. ${txHashOrRef ? 'رقم المعاملة: ' + txHashOrRef : ''}`,
        'withdrawal'
      );
    } else if (newStatus === 'Processing') {
      await update(withdrawalRef, {
        status: 'Processing',
        adminNote: adminNote || ''
      });

      await sendNotification(
        withdrawal.userId,
        '🔄 طلب السحب قيد التنفيذ',
        `طلب السحب الخاص بك بمبلغ ${withdrawal.amount} ج.م قيد المعالجة والإرسال حالياً.`,
        'withdrawal'
      );
    } else if (newStatus === 'Rejected') {
      // Refund balance to user
      await update(withdrawalRef, {
        status: 'Rejected',
        processedAt: Date.now(),
        adminNote: adminNote || 'تم رفض الطلب'
      });

      const userRef = dbRefs.user(withdrawal.userId);
      await runTransaction(userRef, (curr: UserProfile | null) => {
        if (!curr) return curr;
        return {
          ...curr,
          balance: Number(((curr.balance || 0) + withdrawal.amount).toFixed(2))
        };
      });

      // Create refund transaction
      const refundTxRef = push(dbRefs.transactions());
      const refundTx: Transaction = {
        id: refundTxRef.key || Date.now().toString(),
        userId: withdrawal.userId,
        userEmail: withdrawal.userEmail,
        userName: withdrawal.userName,
        type: 'Refund',
        amount: withdrawal.amount,
        description: `استرجاع رصيد طلب السحب المرفوض: ${adminNote || 'بدون سبب محدد'}`,
        timestamp: Date.now(),
        status: 'completed',
        referenceId: withdrawal.id
      };
      await set(refundTxRef, refundTx);

      await sendNotification(
        withdrawal.userId,
        '❌ تم رفض طلب السحب واسترجاع الرصيد',
        `تم رفض طلب السحب بمبلغ ${withdrawal.amount} ج.م واسترجاع المبلغ لمحفظتك. السبب: ${adminNote || 'يرجى مراجعة الدعم'}.`,
        'withdrawal'
      );
    }

    // Log Activity
    await logActivity({
      actorId: adminUser.uid,
      actorEmail: adminUser.email,
      targetUserId: withdrawal.userId,
      action: `Withdrawal ${newStatus}`,
      description: `قام الأدمن بتغيير حالة طلب السحب #${withdrawal.id} إلى ${newStatus}`,
      metadata: { withdrawalId: withdrawal.id, newStatus, adminNote }
    });

    return { success: true, message: `تم تحديث حالة طلب السحب إلى ${newStatus} بنجاح.` };
  } catch (err: any) {
    console.error('Error updating withdrawal:', err);
    return { success: false, message: err.message || 'حدث خطأ أثناء تعديل السحب.' };
  }
}

// Admin: Adjust User Balance or Bonus
export async function adjustUserFinancials(
  adminUser: UserProfile,
  targetUserId: string,
  amountChange: number,
  pointsChange: number,
  reason: string,
  type: 'Adjustment' | 'Bonus'
): Promise<{ success: boolean; message: string }> {
  try {
    const userRef = dbRefs.user(targetUserId);
    const snap = await get(userRef);
    if (!snap.exists()) {
      return { success: false, message: 'المستخدم غير موجود.' };
    }
    const targetUser: UserProfile = snap.val();

    let newBalance = targetUser.balance;
    await runTransaction(userRef, (curr: UserProfile | null) => {
      if (!curr) return curr;
      const updatedBalance = Number(((curr.balance || 0) + amountChange).toFixed(2));
      const updatedPoints = Math.max(0, (curr.points || 0) + pointsChange);
      newBalance = updatedBalance;
      return {
        ...curr,
        balance: Math.max(0, updatedBalance),
        points: updatedPoints,
        totalEarned: amountChange > 0 ? Number(((curr.totalEarned || 0) + amountChange).toFixed(2)) : curr.totalEarned
      };
    });

    // Record Transaction
    const txRef = push(dbRefs.transactions());
    const txData: Transaction = {
      id: txRef.key || Date.now().toString(),
      userId: targetUserId,
      userEmail: targetUser.email,
      userName: targetUser.displayName || targetUser.username,
      type: type,
      amount: amountChange,
      points: pointsChange,
      description: `${type === 'Bonus' ? 'مكافأة إضافية (بونص)' : 'تعديل رصيد إداري'}: ${reason}`,
      timestamp: Date.now(),
      status: 'completed',
      balanceAfter: newBalance
    };
    await set(txRef, txData);

    // Notify User
    await sendNotification(
      targetUserId,
      type === 'Bonus' ? '🎁 مكافأة بونص جديدة!' : 'ℹ️ إشعار مالي من الإدارة',
      `${type === 'Bonus' ? 'تمت إضافة مكافأة' : 'تم تعديل رصيدك'} بمقدار ${amountChange >= 0 ? '+' : ''}${amountChange} ج.م و ${pointsChange >= 0 ? '+' : ''}${pointsChange} نقطة. السبب: ${reason}`,
      type === 'Bonus' ? 'task' : 'system'
    );

    // Log Activity
    await logActivity({
      actorId: adminUser.uid,
      actorEmail: adminUser.email,
      targetUserId,
      action: `User ${type}`,
      description: `قام الأدمن بتعديل رصيد المستخدم بمقدار (${amountChange} ج.م / ${pointsChange} نقطة). السبب: ${reason}`,
      metadata: { amountChange, pointsChange, reason, type }
    });

    return { success: true, message: 'تم تعديل الرصيد بنجاح وتسجيل المعاملة.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'فشل تعديل الرصيد.' };
  }
}
