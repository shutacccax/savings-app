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
    // Fix: Using any-cast to access version() as the environment may have issues resolving inherited Dexie methods
    // Version 4 adds indexing for archiving
    (this as any).version(4).stores({
      goals: 'id, name, accountId, targetDate, isCompleted, isArchived',
      deposits: 'id, goalId, date',
      accounts: 'id, name'
    });
  }
}

export const db = new SavingsDB();