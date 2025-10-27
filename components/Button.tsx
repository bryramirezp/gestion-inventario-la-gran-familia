import React from 'react';

type ButtonOwnProps<E extends React.ElementType = React.ElementType> = {
  as?: E;
  children?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
};

export type ButtonProps<E extends React.ElementType> = ButtonOwnProps<E> &
  Omit<React.ComponentPropsWithoutRef<E>, keyof ButtonOwnProps<E>>;

const defaultElement = 'button';

export const Button = <E extends React.ElementType = typeof defaultElement>({
  children,
  variant = 'default',
  size = 'default',
  className = '',
  as,
  ...props
}: ButtonProps<E>) => {
  const Component = as || defaultElement;

  const baseClasses =
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary-hover',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-muted hover:text-muted-foreground',
    link: 'text-primary underline-offset-4 hover:underline',
  };

  const sizeClasses = {
    default: 'h-10 py-2 px-4',
    sm: 'h-9 px-3 rounded-md',
    lg: 'h-11 px-8 rounded-md',
    icon: 'h-10 w-10',
  };

  return React.createElement(
    Component,
    {
      className: `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`,
      ...props,
    },
    children
  );
};
