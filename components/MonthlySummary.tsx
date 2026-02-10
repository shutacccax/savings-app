
import React, { useEffect, useState } from 'react';
import { formatCurrency } from '../utils/formatters';
import { TrendingUp, TrendingDown, Sparkles, Minus } from 'lucide-react';

interface MonthlySummaryProps {
  thisMonthTotal: number;
  lastMonthTotal: number;
}

export const MonthlySummary: React.FC<MonthlySummaryProps> = ({ thisMonthTotal, lastMonthTotal }) => {
  const [displayTotal, setDisplayTotal] = useState(0);

  // Simple count-up effect
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
      return (
        <span className="text-pink-400 font-medium">No savings yet this month. Start today 💖</span>
      );
    }

    if (lastMonthTotal === 0) {
      return (
        <span className="text-pink-400 font-medium flex items-center">
          <Sparkles size={14} className="mr-1" />
          First savings month! Keep it up!
        </span>
      );
    }

    if (diff > 0) {
      return (
        <span className="text-green-500 font-bold flex items-center">
          <TrendingUp size={14} className="mr-1" />
          {formatCurrency(diff)} more than last month ({Math.round(percentChange)}%)
        </span>
      );
    } else if (diff < 0) {
      return (
        <span className="text-pink-400 font-medium flex items-center">
          <TrendingDown size={14} className="mr-1" />
          {formatCurrency(Math.abs(diff))} less than last month
        </span>
      );
    }

    return (
      <span className="text-gray-400 font-medium flex items-center">
        <Minus size={14} className="mr-1" />
        Same as last month. Consistent!
      </span>
    );
  };

  return (
    <div className="bg-gradient-to-br from-white to-pink-50/50 rounded-3xl p-6 shadow-sm border border-pink-100 mb-8 relative overflow-hidden group">
      {/* Decorative background element */}
      <div className="absolute -right-4 -top-4 text-pink-100/40 group-hover:scale-110 transition-transform duration-700">
        <Sparkles size={100} />
      </div>

      <div className="relative z-10">
        <h2 className="text-xs uppercase tracking-widest font-black text-pink-300 mb-1">Monthly Summary</h2>
        <div className="text-2xl font-black text-gray-800 mb-2">
          You saved <span className="text-pink-500">{formatCurrency(displayTotal)}</span> this month
        </div>
        <div className="text-sm">
          {renderSubtext()}
        </div>
      </div>
    </div>
  );
};
