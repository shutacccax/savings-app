
export interface Goal {
  id?: string; // Using string for Firestore doc IDs
  name: string;
  emoji?: string;
  totalAmount: number;
  targetDate: string;
  accountId: string;
  createdAt: string;
  isCompleted?: boolean;
  completedAt?: string;
  isArchived?: boolean;
  archivedAt?: string | null;
}

export interface Deposit {
  id?: string;
  goalId: string;
  amount: number;
  date: string;
}

export interface Account {
  id?: string;
  name: string;
  initialBalance: number;
  createdAt: string;
}

export interface GoalExtended extends Goal {
  totalSaved: number;
  remaining: number;
  progressPercent: number;
  daysRemaining: number;
  dailyRequired: number;
  accountName: string;
}
