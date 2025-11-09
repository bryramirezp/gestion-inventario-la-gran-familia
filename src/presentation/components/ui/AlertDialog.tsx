import React, { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button, ButtonProps } from '@/presentation/components/ui/Button';

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center"
      onClick={onClose}
    >
      {children}
    </div>,
    document.body
  );
};

export const AlertDialogContent: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div
    className={`relative bg-card rounded-lg shadow-xl w-full max-w-md m-4 p-6 animate-content-show z-[100] ${className}`}
    onClick={(e) => e.stopPropagation()}
  >
    {children}
  </div>
);

export const AlertDialogHeader: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={`flex flex-col space-y-2 text-center sm:text-left ${className}`}>{children}</div>
);

export const AlertDialogTitle: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => <h2 className={`text-lg font-semibold ${className}`}>{children}</h2>;

export const AlertDialogDescription: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>;

export const AlertDialogFooter: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div
    className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4 ${className}`}
  >
    {children}
  </div>
);

// FIX: Update AlertDialogCancel to accept all Button props except variant, to allow for props like 'disabled'.
export const AlertDialogCancel: React.FC<Omit<ButtonProps<'button'>, 'variant'>> = ({
  children,
  ...props
}) => (
  <Button variant="outline" {...props}>
    {children || 'Cancelar'}
  </Button>
);

// FIX: Update AlertDialogAction to accept all Button props, which fixes an issue where the `disabled` prop was not allowed.
export const AlertDialogAction: React.FC<ButtonProps<'button'>> = ({ children, ...props }) => (
  <Button {...props}>{children}</Button>
);
