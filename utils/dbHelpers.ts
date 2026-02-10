
import { db } from '../db/db';

/**
 * Recalculates total saved for a goal and updates its completion status in the database.
 * This should be called after any deposit addition, edit, or deletion.
 */
export const syncGoalCompletion = async (goalId: number) => {
  try {
    const goal = await db.goals.get(goalId);
    if (!goal) return;

    const deposits = await db.deposits.where('goalId').equals(goalId).toArray();
    const totalSaved = deposits.reduce((sum, d) => sum + d.amount, 0);
    const isReached = totalSaved >= goal.totalAmount;

    if (isReached && !goal.isCompleted) {
      await db.goals.update(goalId, {
        isCompleted: true,
        completedAt: new Date().toISOString()
      });
    } else if (!isReached && goal.isCompleted) {
      await db.goals.update(goalId, {
        isCompleted: false,
        completedAt: undefined
      });
    }
  } catch (err) {
    console.error('Failed to sync goal completion:', err);
  }
};
