import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  label, 
  showPercentage = true,
  className = '' 
}) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between mb-1">
        {label && <span className="text-sm font-medium text-fire-gray">{label}</span>}
        {showPercentage && <span className="text-sm font-medium text-fire-orange">{Math.round(progress)}%</span>}
      </div>
      <div className="w-full bg-fire-secondary rounded-full h-2.5 overflow-hidden">
        <div 
          className="bg-fire-orange h-2.5 rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};
