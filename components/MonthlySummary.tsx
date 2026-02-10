import React, { useEffect, useState } from 'react';
import { formatCurrency } from '../utils/formatters';
import { TrendingUp, TrendingDown, Sparkles, Minus } from 'lucide-react';

interface MonthlySummaryProps {
  thisMonthTotal: number;
  lastMonthTotal: number;
}

export const MonthlySummary: React.FC<MonthlySummaryProps> = ({ thisMonthTotal, lastMonthTotal }) => {
  const [displayTotal, setDisplayTotal] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = thisMonthTotal;
    if (start === end) {
      setDisplayTotal(end);
      return;
    }
    const duration = 1000;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayTotal(end);
        clearInterval(timer);
      } else {
        setDisplayTotal(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [thisMonthTotal]);

  const diff = thisMonthTotal - lastMonthTotal;
  const percentChange = lastMonthTotal > 0 ? (diff / lastMonthTotal) * 100 : 0;

  const renderSubtext = () => {
    if (thisMonthTotal === 0) {
      return <span className="text-accent/60 font-medium">No savings yet this month.</span>;
    }
    if (lastMonthTotal === 0) {
      return <span className="text-accent/60 font-medium flex items-center"><Sparkles size={14} className="mr-1 opacity-10" />First savings month!</span>;
    }
    if (diff > 0) {
      return <span className="text-green-500 font-bold flex items-center"><TrendingUp size={14} className="mr-1" />+{formatCurrency(diff)} ({Math.round(percentChange)}%)</span>;
    } else if (diff < 0) {
      return <span className="text-accent/60 font-medium flex items-center"><TrendingDown size={14} className="mr-1" />-{formatCurrency(Math.abs(diff))}</span>;
    }
    return <span className="text-gray-400 font-medium flex items-center"><Minus size={14} className="mr-1" />Consistent!</span>;
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-6 shadow-sm border border-accent/10 dark:border-white/5 mb-8 relative overflow-hidden group">
      <div className="absolute -right-4 -top-4 text-accent/5 dark:text-accent/[0.01] group-hover:scale-110 transition-transform duration-700">
        <Sparkles size={120} className="opacity-5 dark:opacity-[0.02]" />
      </div>
      <div className="relative z-10">
        <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-accent opacity-40 mb-1">Monthly Summary</h2>
        <div className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 leading-tight">
          You saved <span className="text-accent">{formatCurrency(displayTotal)}</span>
        </div>
        <div className="text-xs">{renderSubtext()}</div>
      </div>
    </div>
  );
};