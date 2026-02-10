
import React from 'react';

interface ProgressBarProps {
  progress: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  
  return (
    <div className="w-full bg-pink-100 rounded-full h-3 mt-2 overflow-hidden">
      <div 
        className="bg-pink-500 h-full rounded-full transition-all duration-700 ease-out shadow-sm"
        style={{ width: `${clampedProgress}%` }}
      />
    </div>
  );
};
