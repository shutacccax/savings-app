
import { Dexie, Table } from 'dexie';
import { Goal, Deposit, Account } from '../types';

export class SavingsDB extends Dexie {
  goals!: Table<Goal>;
  deposits!: Table<Deposit>;
  accounts!: Table<Account>;

  constructor() {
    super('SavingsDB');
    this.version(2).stores({
      goals: '++id, name, accountId, targetDate, isCompleted',
      deposits: '++id, goalId, date',
      accounts: '++id, name'
    });
  }
}

export const db = new SavingsDB();
