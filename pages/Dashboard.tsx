
import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { GoalExtended } from '../types';
import { formatCurrency, formatDate, calculateDaysRemaining, roundToTwo } from '../utils/formatters';
import { ProgressBar } from '../components/ProgressBar';
import { DepositModal } from '../components/DepositModal';
import { EditGoalModal } from '../components/EditGoalModal';
import { ViewDepositsModal } from '../components/ViewDepositsModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { MonthlySummary } from '../components/MonthlySummary';
import { PiggyBank, Calendar, Wallet, Trash2, History, Archive, RotateCcw, ChevronDown, ChevronUp, Edit3 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { auth } from '../firebase/config';
import { fsDeleteGoal, fsArchiveGoal, fsRestoreGoal } from '../firebase/firestoreService';

export const Dashboard: React.FC = () => {
  const [selectedGoal, setSelectedGoal] = useState<any | null>(null);
  const [editingGoal, setEditingGoal] = useState<any | null>(null);
  const [viewHistoryGoal, setViewHistoryGoal] = useState<any | null>(null);
  const [archiveGoalId, setArchiveGoalId] = useState<string | null>(null);
  const [restoreGoalId, setRestoreGoalId] = useState<string | null>(null);
  const [deleteGoalId, setDeleteGoalId] = useState<string | null>(null);
  const [isArchiveExpanded, setIsArchiveExpanded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  const prevGoalsRef = useRef<Record<string, boolean>>({});
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (msg: string) => setToast(msg);

  const dashboardData = useLiveQuery(async () => {
    const allGoals = await db.goals.toArray();
    const allDeposits = await db.deposits.toArray();
    const now = new Date();
    const activeGoalIds = new Set(allGoals.filter(g => !g.isArchived).map(g => g.id));
    
    let thisMonthTotal = 0;
    let lastMonthTotal = 0;
    allDeposits.forEach(d => {
      if (!activeGoalIds.has(d.goalId)) return;
      const dDate = new Date(d.date);
      if (dDate.getMonth() === now.getMonth() && dDate.getFullYear() === now.getFullYear()) thisMonthTotal += d.amount;
      else if (dDate.getMonth() === (now.getMonth() - 1 + 12) % 12) lastMonthTotal += d.amount;
    });

    const extendedGoals: GoalExtended[] = await Promise.all(
      allGoals.map(async (goal) => {
        const deposits = allDeposits.filter(d => d.goalId === goal.id);
        const acc = await db.accounts.get(goal.accountId);
        const totalSaved = roundToTwo(deposits.reduce((sum, d) => sum + d.amount, 0));
        const remaining = Math.max(0, roundToTwo(goal.totalAmount - totalSaved));
        const progressPercent = Math.min(100, goal.totalAmount > 0 ? (totalSaved / goal.totalAmount) * 100 : 0);
        const daysRemaining = calculateDaysRemaining(goal.targetDate);
        
        return {
          ...goal,
          totalSaved,
          remaining,
          progressPercent,
          daysRemaining,
          dailyRequired: daysRemaining > 0 ? roundToTwo(remaining / daysRemaining) : 0,
          accountName: acc?.name || '?',
          isCompleted: totalSaved >= goal.totalAmount 
        };
      })
    );

    return { activeGoals: extendedGoals.filter(g => !g.isArchived), archivedGoals: extendedGoals.filter(g => g.isArchived), thisMonthTotal, lastMonthTotal };
  });

  useEffect(() => {
    if (!dashboardData?.activeGoals) return;

    const currentActiveGoals = dashboardData.activeGoals;

    if (!hasInitializedRef.current) {
      currentActiveGoals.forEach(g => {
        prevGoalsRef.current[g.id!] = !!g.isCompleted;
      });
      hasInitializedRef.current = true;
      return;
    }

    currentActiveGoals.forEach(g => {
      const goalId = g.id!;
      const isCurrentlyCompleted = !!g.isCompleted;
      const wasPreviouslyCompleted = prevGoalsRef.current[goalId];

      if (wasPreviouslyCompleted === false && isCurrentlyCompleted) {
        confetti({ 
          particleCount: 100, 
          spread: 70, 
          origin: { y: 0.6 }, 
          colors: [getComputedStyle(document.documentElement).getPropertyValue('--accent')] 
        });
      }
      prevGoalsRef.current[goalId] = isCurrentlyCompleted;
    });
  }, [dashboardData?.activeGoals]);

  if (!dashboardData) return null;
  const { activeGoals, archivedGoals, thisMonthTotal, lastMonthTotal } = dashboardData;

  const GoalCard = ({ goal, archived = false }: { goal: GoalExtended, archived?: boolean }) => (
    <div className={`bg-white dark:bg-zinc-900 rounded-2xl p-5 border shadow-sm relative transition-all duration-300 ${archived ? 'grayscale opacity-60 border-zinc-100 dark:border-white/[0.03]' : (goal.isCompleted ? 'border-accent/30 dark:border-accent/10' : 'border-zinc-100 dark:border-white/[0.03]')}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-3">
          <span className="text-3xl">{goal.emoji || '🎯'}</span>
          <div>
            <h3 className="font-bold text-zinc-800 dark:text-zinc-100 truncate max-w-[140px]">{goal.name}</h3>
            <div className="flex items-center text-[10px] font-bold text-accent uppercase tracking-wider opacity-70">
              <Wallet size={12} className="mr-1" />{goal.accountName}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className={`text-lg font-bold mr-1 ${goal.isCompleted ? 'text-green-500' : 'text-accent'}`}>{Math.round(goal.progressPercent)}%</div>
          {!archived ? (
            <div className="flex">
              <button onClick={() => setEditingGoal(goal)} className="p-2 text-zinc-300 hover:text-accent transition-colors"><Edit3 size={18} /></button>
              <button onClick={() => setArchiveGoalId(goal.id!)} className="p-2 text-zinc-300 hover:text-accent transition-colors"><Archive size={18} /></button>
            </div>
          ) : (
            <div className="flex">
              <button onClick={() => setRestoreGoalId(goal.id!)} className="p-2 text-accent"><RotateCcw size={18} /></button>
              <button onClick={() => setDeleteGoalId(goal.id!)} className="p-2 text-red-400"><Trash2 size={18} /></button>
            </div>
          )}
        </div>
      </div>

      <div className="mb-5">
        <div className="flex justify-between text-[10px] font-bold uppercase mb-1.5 text-zinc-400">
          <span>{formatCurrency(goal.totalSaved)}</span>
          <span>Target: {formatCurrency(goal.totalAmount)}</span>
        </div>
        <ProgressBar progress={goal.progressPercent} />
      </div>

      {/* Peso Challenge Specific View */}
      {goal.mode === 'challenge' && goal.denominations && goal.denominations.length > 0 && (
        <div className="mb-5 grid grid-cols-3 gap-2">
          {goal.denominations.map(d => (
            <div key={d.value} className="bg-zinc-50 dark:bg-white/[0.02] p-2 rounded-xl border border-zinc-100 dark:border-white/[0.05]">
              <div className="flex justify-between items-center text-[8px] font-bold text-zinc-400 uppercase tracking-tighter mb-1">
                <span>₱{d.value}</span>
                <span className={d.currentQty >= d.targetQty ? 'text-green-500' : 'text-accent'}>{d.currentQty}/{d.targetQty}</span>
              </div>
              <div className="h-1 bg-accent/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${d.currentQty >= d.targetQty ? 'bg-green-500' : 'bg-accent'}`}
                  style={{ width: `${Math.min(100, (d.currentQty / d.targetQty) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-accent/5 dark:bg-white/[0.02] rounded-xl p-3 border border-accent/5 dark:border-transparent">
          <div className="text-[10px] text-accent uppercase font-bold tracking-wider mb-0.5 opacity-60">To Save</div>
          <div className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{formatCurrency(goal.remaining)}</div>
        </div>
        <div className="bg-accent/5 dark:bg-white/[0.02] rounded-xl p-3 border border-accent/5 dark:border-transparent">
          <div className="text-[10px] text-accent uppercase font-bold tracking-wider mb-0.5 opacity-60">Daily</div>
          <div className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{goal.isCompleted ? '🎉' : formatCurrency(goal.dailyRequired)}</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center text-[11px] text-zinc-400 font-medium">
          <Calendar size={13} className="mr-1 opacity-50" />
          {formatDate(goal.targetDate)}
        </div>
        {!archived && (
          <div className="flex gap-2">
            <button onClick={() => setViewHistoryGoal(goal)} className="p-2 text-zinc-400 hover:text-accent transition-colors"><History size={20} /></button>
            <button onClick={() => setSelectedGoal(goal)} disabled={goal.isCompleted} className={`px-4 py-2 rounded-xl font-bold text-xs uppercase transition-all ${goal.isCompleted ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400' : 'bg-accent text-white shadow-sm shadow-accent/20 active:scale-95'}`}>
              {goal.isCompleted ? 'Done' : 'Deposit'}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="px-5">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">Savings</h1>
        <p className="text-sm text-zinc-400 font-medium">Simplify your journey 🌸</p>
      </header>

      <MonthlySummary thisMonthTotal={thisMonthTotal} lastMonthTotal={lastMonthTotal} />

      <div className="space-y-4 mb-8">
        {activeGoals.length === 0 ? (
          <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-12 text-center border-2 border-dashed border-zinc-100 dark:border-white/5">
            <PiggyBank size={48} className="mx-auto text-zinc-200 dark:text-zinc-800 mb-3" />
            <p className="text-zinc-400 text-sm font-medium">Ready to start saving?</p>
          </div>
        ) : (
          activeGoals.map(g => <GoalCard key={g.id} goal={g} />)
        )}
      </div>

      {archivedGoals.length > 0 && (
        <div>
          <button onClick={() => setIsArchiveExpanded(!isArchiveExpanded)} className="flex items-center justify-between w-full p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl text-zinc-400 font-bold text-[11px] uppercase tracking-widest border border-transparent dark:border-white/5">
            <span>Archived ({archivedGoals.length})</span>
            {isArchiveExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {isArchiveExpanded && <div className="space-y-4 mt-4 animate-in slide-in-from-top-2">{archivedGoals.map(g => <GoalCard key={g.id} goal={g} archived />)}</div>}
        </div>
      )}

      {selectedGoal && <DepositModal goal={selectedGoal} onClose={() => setSelectedGoal(null)} onSuccess={() => showToast('Saved! ✨')} />}
      {editingGoal && <EditGoalModal goal={editingGoal} onClose={() => setEditingGoal(null)} onSuccess={showToast} />}
      {viewHistoryGoal && <ViewDepositsModal goal={viewHistoryGoal} onClose={() => setViewHistoryGoal(null)} onToast={showToast} />}
      <ConfirmationModal isOpen={archiveGoalId !== null} title="Archive?" message="Hide from active list." confirmLabel="Archive" onConfirm={() => fsArchiveGoal(auth.currentUser!.uid, archiveGoalId!).then(() => { showToast('Archived'); setArchiveGoalId(null); })} onCancel={() => setArchiveGoalId(null)} />
      <ConfirmationModal isOpen={restoreGoalId !== null} title="Restore?" message="Move to active." confirmLabel="Restore" onConfirm={() => fsRestoreGoal(auth.currentUser!.uid, restoreGoalId!).then(() => { showToast('Restored'); setRestoreGoalId(null); })} onCancel={() => setRestoreGoalId(null)} />
      <ConfirmationModal isOpen={deleteGoalId !== null} title="Delete Forever?" message="Cannot be undone." confirmLabel="Delete" confirmVariant="danger" onConfirm={() => fsDeleteGoal(auth.currentUser!.uid, deleteGoalId!).then(() => { showToast('Deleted'); setDeleteGoalId(null); })} onCancel={() => setDeleteGoalId(null)} />
    </div>
  );
};
