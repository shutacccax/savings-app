import { db } from '../db/db';
import { fsAddGoal, fsAddAccount, fsAddDeposit, isFirestoreEmpty } from './firestoreService';

export const migrateDexieToFirestore = async (uid: string) => {
  const flagKey = `firestoreMigrated_${uid}`;
  if (localStorage.getItem(flagKey)) return;

  const isEmpty = await isFirestoreEmpty(uid);
  if (!isEmpty) {
    // If Firestore is NOT empty, we don't upload from Dexie (Firestore is source of truth)
    // Dexie will be overwritten by real-time listeners.
    localStorage.setItem(flagKey, 'true');
    return;
  }

  // If Firestore IS empty, upload Dexie data
  try {
    const goals = await db.goals.toArray();
    const accounts = await db.accounts.toArray();
    const deposits = await db.deposits.toArray();

    // Map account IDs to new Firestore IDs to maintain relationships during migration
    const accountMap: Record<number | string, string> = {};
    for (const acc of accounts) {
      const oldId = acc.id!;
      delete acc.id;
      const newId = await fsAddAccount(uid, acc);
      accountMap[oldId] = newId;
    }

    const goalMap: Record<number | string, string> = {};
    for (const goal of goals) {
      const oldId = goal.id!;
      const mappedAccountId = accountMap[goal.accountId] || goal.accountId.toString();
      delete goal.id;
      const newId = await fsAddGoal(uid, { ...goal, accountId: mappedAccountId as any });
      goalMap[oldId] = newId;
    }

    for (const dep of deposits) {
      const mappedGoalId = goalMap[dep.goalId] || dep.goalId.toString();
      delete dep.id;
      await fsAddDeposit(uid, { ...dep, goalId: mappedGoalId as any });
    }

    localStorage.setItem(flagKey, 'true');
  } catch (err) {
    console.error("Migration failed:", err);
  }
};