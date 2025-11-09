import React from 'react';

// Sanitización básica de inputs (temporalmente sin DOMPurify)
// const sanitizeInput = (value: string): string => {
//   // Sanitización básica sin DOMPurify por ahora
//   return value.replace(/[<>]/g, '');
// };

// --- Input ---
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }
>(({ className, error, ...props }, ref) => {
  const errorClasses = 'border-destructive dark:border-destructive focus-visible:ring-destructive';
  const baseClasses =
    'flex h-10 w-full rounded-md border border-input dark:border-dark-input bg-background dark:bg-dark-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground dark:placeholder:text-dark-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:focus-visible:ring-dark-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <input
      className={`${baseClasses} ${error ? errorClasses : ''} ${className || ''}`}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

// --- Label ---
export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => {
  return (
    <label
      className={`block text-sm font-medium text-foreground dark:text-dark-foreground mb-1 ${className}`}
      ref={ref}
      {...props}
    />
  );
});
Label.displayName = 'Label';

// --- Select ---
export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }
>(({ className, children, error, ...props }, ref) => {
  const errorClasses = 'border-destructive dark:border-destructive focus:ring-destructive';
  const baseClasses =
    'flex h-10 w-full items-center justify-between rounded-md border border-input dark:border-dark-input bg-background dark:bg-dark-background text-foreground dark:text-dark-foreground px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground dark:placeholder:text-dark-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring dark:focus:ring-dark-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
  return (
    <select
      className={`${baseClasses} ${error ? errorClasses : ''} ${className}`}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  );
});
Select.displayName = 'Select';

// --- Textarea ---
export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }
>(({ className, error, ...props }, ref) => {
  const errorClasses = 'border-destructive dark:border-destructive focus-visible:ring-destructive';
  const baseClasses =
    'flex min-h-[80px] w-full rounded-md border border-input dark:border-dark-input bg-background dark:bg-dark-background text-foreground dark:text-dark-foreground px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground dark:placeholder:text-dark-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:focus-visible:ring-dark-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
  return (
    <textarea
      className={`${baseClasses} ${error ? errorClasses : ''} ${className}`}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

// --- FormError ---
export const FormError: React.FC<{ message?: string; className?: string; id?: string }> = ({
  message,
  className,
  id,
}) => {
  if (!message) return null;
  return (
    <p 
      id={id}
      role="alert"
      className={`text-sm font-medium text-destructive mt-1 ${className || ''}`}
    >
      {message}
    </p>
  );
};

// --- FormContainer ---
interface FormContainerProps {
  children: React.ReactNode;
  className?: string;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  id?: string;
}

export const FormContainer: React.FC<FormContainerProps> = ({
  children,
  className,
  onSubmit,
  id,
}) => {
  return (
    <form
      id={id}
      onSubmit={onSubmit}
      className={`px-6 py-4 space-y-6 overflow-y-auto flex-1 ${className || ''}`}
    >
      {children}
    </form>
  );
};

// --- FormField ---
interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
  error?: string;
  errorId?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  children,
  className,
  error,
  errorId,
}) => {
  return (
    <div className={`space-y-2 ${className || ''}`}>
      {children}
      {error && <FormError message={error} id={errorId} />}
    </div>
  );
};

// --- FormFieldGroup ---
interface FormFieldGroupProps {
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2 | 3;
}

export const FormFieldGroup: React.FC<FormFieldGroupProps> = ({
  children,
  className,
  columns = 1,
}) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  };

  return (
    <div className={`grid ${gridClasses[columns]} gap-4 ${className || ''}`}>
      {children}
    </div>
  );
};
