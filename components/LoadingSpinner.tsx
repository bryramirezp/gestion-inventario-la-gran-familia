import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
  centered?: boolean; // Nueva prop para control de centrado
  fullScreen?: boolean; // Nueva prop para ocupar toda la pantalla
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message = 'Cargando...',
  className = '',
  centered = false,
  fullScreen = false
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const containerClasses = fullScreen
    ? `fixed inset-0 z-50 flex flex-col items-center justify-center gap-2 bg-background ${className}`
    : centered
    ? `flex flex-col items-center justify-center gap-2 min-h-[200px] ${className}`
    : `flex flex-col items-center justify-center gap-2 ${className}`;

  return (
    <div className={containerClasses}>
      <div
        className={`animate-spin rounded-full border-2 border-primary border-t-transparent ${sizeClasses[size]}`}
      />
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;