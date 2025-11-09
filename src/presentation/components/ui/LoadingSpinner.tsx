import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
  centered?: boolean; // Centra el spinner con min-height
  fullScreen?: boolean; // Ocupa toda la pantalla (fixed, centrado vertical y horizontal)
  centerScreen?: boolean; // Centra en el viewport (usa h-screen, centrado vertical y horizontal)
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message = 'Cargando...',
  className = '',
  centered = false,
  fullScreen = false,
  centerScreen = false,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  // Si fullScreen: fixed overlay que cubre toda la pantalla
  // Si centerScreen: ocupa toda la altura del viewport y centra
  // Si centered: centra con min-height mínimo
  // Por defecto: solo centra horizontalmente
  const containerClasses = fullScreen
    ? `fixed inset-0 z-50 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-sm ${className}`
    : centerScreen
    ? `flex flex-col items-center justify-center gap-2 h-screen w-full ${className}`
    : centered
    ? `flex flex-col items-center justify-center gap-2 min-h-screen ${className}`
    : `flex flex-col items-center justify-center gap-2 ${className}`;

  return (
    <div className={containerClasses}>
      <div
        className={`animate-spin rounded-full border-2 border-primary border-t-transparent ${sizeClasses[size]}`}
        aria-label="Cargando"
        role="status"
      />
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;