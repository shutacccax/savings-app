
export interface Goal {
  id?: number;
  name: string;
  totalAmount: number;
  targetDate: string;
  accountId: number;
  createdAt: string;
  isCompleted?: boolean;
  completedAt?: string;
}

export interface Deposit {
  id?: number;
  goalId: number;
  amount: number;
  date: string;
}

export interface Account {
  id?: number;
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
