import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { GoalExtended } from '../types';
import { formatCurrency, formatDate, calculateDaysRemaining, roundToTwo } from '../utils/formatters';
import { ProgressBar } from '../components/ProgressBar';
import { DepositModal } from '../components/DepositModal';
import { ViewDepositsModal } from '../components/ViewDepositsModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { MonthlySummary } from '../components/MonthlySummary';
import { Plus, PiggyBank, Calendar, Wallet, Trash2, History, CheckCircle2, PartyPopper, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';

export const Dashboard: React.FC = () => {
  const [selectedGoal, setSelectedGoal] = useState<any | null>(null);
  const [viewHistoryGoal, setViewHistoryGoal] = useState<any | null>(null);
  const [deleteGoalId, setDeleteGoalId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  
  const completedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (msg: string) => setToast(msg);

  const dashboardData = useLiveQuery(async () => {
    try {
      const allGoals = await db.goals.toArray();
      const allDeposits = await db.deposits.toArray();
      
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const lastMonthDate = new Date();
      lastMonthDate.setMonth(now.getMonth() - 1);
      const lastMonth = lastMonthDate.getMonth();
      const lastMonthYear = lastMonthDate.getFullYear();

      let thisMonthTotal = 0;
      let lastMonthTotal = 0;

      allDeposits.forEach(d => {
        const dDate = new Date(d.date);
        const dMonth = dDate.getMonth();
        const dYear = dDate.getFullYear();

        if (dMonth === currentMonth && dYear === currentYear) {
          thisMonthTotal = roundToTwo(thisMonthTotal + d.amount);
        } else if (dMonth === lastMonth && dYear === lastMonthYear) {
          lastMonthTotal = roundToTwo(lastMonthTotal + d.amount);
        }
      });

      const extendedGoals: GoalExtended[] = await Promise.all(
        allGoals.map(async (goal) => {
          const deposits = allDeposits.filter(d => d.goalId === goal.id);
          const accounts = await db.accounts.get(goal.accountId);
          
          const totalSaved = roundToTwo(deposits.reduce((sum, d) => sum + d.amount, 0));
          const remaining = Math.max(0, roundToTwo(goal.totalAmount - totalSaved));
          const progressPercent = Math.min(100, goal.totalAmount > 0 ? (totalSaved / goal.totalAmount) * 100 : 0);
          const daysRemaining = calculateDaysRemaining(goal.targetDate);
          
          // Safer daily calculation
          const dailyRequired = daysRemaining > 0 ? roundToTwo(remaining / daysRemaining) : 0;

          const isReached = totalSaved >= goal.totalAmount;

          if (isReached && !completedRef.current.has(goal.id!)) {
            triggerConfetti();
            completedRef.current.add(goal.id!);
          } else if (!isReached) {
            completedRef.current.delete(goal.id!);
          }

          return {
            ...goal,
            totalSaved,
            remaining,
            progressPercent,
            daysRemaining,
            dailyRequired,
            accountName: accounts?.name || 'Unknown Account',
            isCompleted: isReached 
          };
        })
      );

      return {
        goals: extendedGoals,
        thisMonthTotal,
        lastMonthTotal
      };
    } catch (err) {
      console.error('Dashboard Error:', err);
      return null;
    }
  });

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 300 };
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 50 * (timeLeft / duration);
      const colors = ['#ff4da6', '#ffffff', '#ffdf00'];
      
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors });
    }, 250);
  };

  const handleDeleteGoal = async () => {
    if (!deleteGoalId) return;
    try {
      // Corrected the transaction call to pass tables as an array and handle properties safely
      await db.transaction('rw', [db.goals, db.deposits], async () => {
        await db.deposits.where('goalId').equals(deleteGoalId).delete();
        await db.goals.delete(deleteGoalId);
      });
      showToast('Goal deleted');
      setDeleteGoalId(null);
    } catch (err) {
      console.error(err);
      showToast('Error: Failed to delete goal');
    }
  };

  if (!dashboardData) return <div className="p-12 text-center text-pink-400 font-bold animate-pulse">Loading Savings...</div>;

  const { goals, thisMonthTotal, lastMonthTotal } = dashboardData;

  return (
    <div className="px-4 pb-24 pt-6 max-w-2xl mx-auto">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-pink-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 size={18} className="mr-2" />
          <span className="font-bold text-sm">{toast}</span>
        </div>
      )}

      <header className="mb-8">
        <h1 className="text-3xl font-black text-pink-600 tracking-tight">My Goals</h1>
        <p className="text-pink-400 font-medium">Your financial journey starts here 🌸</p>
      </header>

      <MonthlySummary 
        thisMonthTotal={thisMonthTotal} 
        lastMonthTotal={lastMonthTotal} 
      />

      {goals.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border-2 border-dashed border-pink-200">
          <PiggyBank size={64} className="mx-auto text-pink-100 mb-4" />
          <p className="text-gray-500 font-medium mb-6">Start your first goal today!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {goals.map((goal) => (
            <div 
              key={goal.id} 
              className={`bg-white rounded-3xl shadow-sm border p-5 overflow-hidden relative group animate-in fade-in slide-in-from-bottom-2 duration-500 transition-all ${
                goal.isCompleted ? 'border-pink-200 ring-4 ring-pink-50/50' : 'border-pink-50'
              }`}
            >
              <button
                onClick={() => setDeleteGoalId(goal.id!)}
                className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-400 transition-colors z-10"
              >
                <Trash2 size={18} />
              </button>

              <div className="flex justify-between items-start mb-4 pr-8">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-bold text-gray-800 leading-tight">{goal.name}</h3>
                    {goal.isCompleted && (
                      <span className="flex items-center bg-green-100 text-green-600 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                        <CheckCircle2 size={10} className="mr-1" />
                        Completed
                      </span>
                    )}
                    {!goal.isCompleted && goal.daysRemaining < 0 && (
                      <span className="flex items-center bg-red-50 text-red-500 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                        <AlertTriangle size={10} className="mr-1" />
                        Date Passed
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-[10px] font-black text-pink-400 mt-1.5 uppercase tracking-widest">
                    <Wallet size={12} className="mr-1" />
                    {goal.accountName}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xl font-black ${goal.isCompleted ? 'text-green-500' : 'text-pink-500'}`}>
                    {Math.round(goal.progressPercent)}%
                  </div>
                </div>
              </div>

              <div className="mb-5">
                <div className="flex justify-between text-[11px] font-black uppercase tracking-wider mb-1.5">
                  <span className="text-gray-400">{formatCurrency(goal.totalSaved)}</span>
                  <span className="text-pink-300">Target: {formatCurrency(goal.totalAmount)}</span>
                </div>
                <ProgressBar progress={goal.progressPercent} />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-pink-50/50 rounded-2xl p-3 border border-pink-100/50">
                  <div className="text-[10px] text-pink-400 uppercase font-black tracking-widest mb-1">Remaining</div>
                  <div className="text-sm font-black text-gray-700">{formatCurrency(goal.remaining)}</div>
                </div>
                <div className="bg-pink-50/50 rounded-2xl p-3 border border-pink-100/50">
                  <div className="text-[10px] text-pink-400 uppercase font-black tracking-widest mb-1">Daily Goal</div>
                  <div className="text-sm font-black text-gray-700">
                    {goal.isCompleted ? 'Reached! 🎉' : goal.daysRemaining > 0 ? formatCurrency(goal.dailyRequired) : 'Overdue'}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center text-xs text-gray-400 font-bold">
                  <Calendar size={14} className="mr-1 text-pink-200" />
                  {formatDate(goal.targetDate)}
                  {!goal.isCompleted && goal.daysRemaining > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-green-50 text-green-500 rounded-full font-black text-[10px]">
                      {goal.daysRemaining}D LEFT
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewHistoryGoal(goal)}
                    className="flex items-center bg-pink-50 text-pink-500 px-3 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all hover:bg-pink-100"
                  >
                    <History size={14} className="mr-1" />
                    Logs
                  </button>
                  <button
                    onClick={() => setSelectedGoal(goal)}
                    disabled={goal.isCompleted}
                    className={`flex items-center px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all ${
                      goal.isCompleted 
                        ? 'bg-gray-100 text-gray-400 shadow-none cursor-not-allowed' 
                        : 'bg-pink-500 text-white shadow-pink-100'
                    }`}
                  >
                    {goal.isCompleted ? <PartyPopper size={16} className="mr-1" /> : <Plus size={16} className="mr-1" />}
                    {goal.isCompleted ? 'Saved' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedGoal && (
        <DepositModal 
          goal={selectedGoal} 
          onClose={() => setSelectedGoal(null)} 
          onSuccess={() => showToast('Savings logged! ✨')}
        />
      )}

      {viewHistoryGoal && (
        <ViewDepositsModal
          goal={viewHistoryGoal}
          onClose={() => setViewHistoryGoal(null)}
          onToast={showToast}
        />
      )}

      <ConfirmationModal
        isOpen={deleteGoalId !== null}
        title="Delete Goal?"
        message="This will remove the goal and all its savings records permanently. Ready to let it go?"
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleDeleteGoal}
        onCancel={() => setDeleteGoalId(null)}
      />
    </div>
  );
};
