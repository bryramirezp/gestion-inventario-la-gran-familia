import React from 'react';

type ButtonOwnProps<E extends React.ElementType = React.ElementType> = {
  as?: E;
  children?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  loading?: boolean;
  loadingText?: string;
};

export type ButtonProps<E extends React.ElementType> = ButtonOwnProps<E> &
  Omit<React.ComponentPropsWithoutRef<E>, keyof ButtonOwnProps<E>>;

const defaultElement = 'button';

export const Button = <E extends React.ElementType = typeof defaultElement>({
  children,
  variant = 'default',
  size = 'default',
  className = '',
  loading = false,
  loadingText,
  as,
  disabled,
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

  const isLoading = loading;
  const isDisabled = disabled || isLoading;

  // Determinar el tamaño del spinner según el tamaño del botón
  const spinnerSizeClasses = {
    sm: 'h-3 w-3 border',
    default: 'h-4 w-4 border-2',
    lg: 'h-5 w-5 border-2',
    icon: 'h-4 w-4 border-2',
  };

  // Determinar el color del spinner según la variante
  // Para variantes con texto claro (default, destructive), usar border-white/80
  // Para otras variantes, usar el color del texto actual
  const getSpinnerBorderColor = () => {
    if (variant === 'default' || variant === 'destructive') {
      return 'border-current border-t-transparent opacity-80';
    }
    return 'border-current border-t-transparent';
  };

  // Componente spinner simple para usar dentro del botón
  const Spinner = () => (
    <div
      className={`animate-spin rounded-full ${spinnerSizeClasses[size]} ${getSpinnerBorderColor()}`}
      aria-label="Cargando"
      role="status"
      aria-hidden="true"
    />
  );

  // Contenido del botón
  // Si está loading, mostrar spinner + texto (si hay loadingText o children)
  // Si no está loading, mostrar children normalmente
  const content = isLoading ? (
    <>
      <Spinner />
      {loadingText ? (
        <span className="ml-2">{loadingText}</span>
      ) : children ? (
        <span className="ml-2">{children}</span>
      ) : null}
    </>
  ) : (
    children
  );

  return React.createElement(
    Component,
    {
      className: `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`,
      disabled: isDisabled,
      ...props,
    },
    content
  );
};
