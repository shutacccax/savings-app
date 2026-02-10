import Dexie, { Table } from 'dexie';
import { Goal, Deposit, Account } from '../types';

/**
 * SavingsDB extends Dexie to provide a strongly-typed database instance.
 * Dexie acts as an offline cache for Firestore.
 */
export class SavingsDB extends Dexie {
  goals!: Table<Goal>;
  deposits!: Table<Deposit>;
  accounts!: Table<Account>;

  constructor() {
    super('SavingsDB');
    // Version 4 adds indexing for archiving
    this.version(4).stores({
      goals: 'id, name, accountId, targetDate, isCompleted, isArchived',
      deposits: 'id, goalId, date',
      accounts: 'id, name'
    });
  }
}

export const db = new SavingsDB();