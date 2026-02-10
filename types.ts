
export interface Denomination {
  value: number;
  targetQty: number;
  currentQty: number;
}

export interface Goal {
  id?: string;
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
  // Challenge Mode Fields
  mode: 'normal' | 'challenge';
  denominations?: Denomination[];
}

export interface Deposit {
  id?: string;
  goalId: string;
  amount: number;
  date: string;
  // Challenge Mode Fields
  denominationValue?: number;
  quantity?: number;
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
