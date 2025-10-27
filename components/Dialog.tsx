import React, { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {children}
    </div>,
    document.body
  );
};

export const DialogContent: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div
    className={`relative bg-card rounded-lg shadow-xl w-full max-w-2xl m-4 p-6 animate-content-show max-h-[90vh] overflow-y-auto z-[100] ${className}`}
    onClick={(e) => e.stopPropagation()}
  >
    {children}
  </div>
);

export const DialogHeader: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={`flex flex-col space-y-1.5 text-center sm:text-left p-6 ${className}`}>
    {children}
  </div>
);

export const DialogTitle: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <h2 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h2>
);

export const DialogDescription: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>;

export const DialogFooter: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div
    className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-0 ${className}`}
  >
    {children}
  </div>
);
