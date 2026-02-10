import { db } from '../db/db';
import { auth, firestore } from '../firebase/config';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Recalculates total saved for a goal and updates its completion status.
 * Updates Firestore which then propagates to Dexie via listeners.
 */
export const syncGoalCompletion = async (goalId: string | number) => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  try {
    const goal = await db.goals.get(goalId as any);
    if (!goal) return;

    const deposits = await db.deposits.where('goalId').equals(goalId).toArray();
    const totalSaved = deposits.reduce((sum, d) => sum + d.amount, 0);
    const isReached = totalSaved >= goal.totalAmount;

    if (isReached && !goal.isCompleted) {
      const docRef = doc(firestore, `users/${uid}/goals/${goalId}`);
      await updateDoc(docRef, {
        isCompleted: true,
        completedAt: new Date().toISOString(),
        updatedAt: serverTimestamp()
      });
    } else if (!isReached && goal.isCompleted) {
      const docRef = doc(firestore, `users/${uid}/goals/${goalId}`);
      await updateDoc(docRef, {
        isCompleted: false,
        completedAt: null,
        updatedAt: serverTimestamp()
      });
    }
  } catch (err) {
    console.error('Failed to sync goal completion:', err);
  }
};