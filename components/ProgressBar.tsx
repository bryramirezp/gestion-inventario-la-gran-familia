import React from 'react';

interface ProgressBarProps {
  value: number;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, className = '' }) => {
  const displayValue = Math.max(0, Math.min(100, value));
  return (
    <div className={`w-full bg-muted rounded-full h-2 ${className}`}>
      <div
        className="bg-primary h-2 rounded-full transition-all duration-500"
        style={{ width: `${displayValue}%` }}
      />
    </div>
  );
};
