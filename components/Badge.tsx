import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | 'primary'
    | 'secondary'
    | 'destructive'
    | 'success'
    | 'warning'
    | 'inventory-low'
    | 'inventory-medium'
    | 'inventory-high';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'primary', className = '' }) => {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

  const variantClasses = {
    primary:
      'bg-primary text-primary-foreground dark:bg-dark-primary dark:text-dark-primary-foreground',
    secondary:
      'bg-secondary text-secondary-foreground dark:bg-dark-secondary dark:text-dark-secondary-foreground',
    destructive:
      'bg-destructive text-destructive-foreground dark:bg-dark-destructive dark:text-dark-destructive-foreground',
    success:
      'bg-success text-success-foreground dark:bg-dark-success dark:text-dark-success-foreground',
    warning: 'bg-warning text-warning-foreground', // Light theme warning colors work well on dark backgrounds
    'inventory-low': 'bg-inventory-low text-white',
    'inventory-medium': 'bg-inventory-medium text-white',
    'inventory-high': 'bg-inventory-high text-white',
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>{children}</span>
  );
};
