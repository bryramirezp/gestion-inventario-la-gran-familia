import React from 'react';
import { useTheme } from '@/app/providers/ThemeProvider';
import { SunIcon, MoonIcon } from '@/presentation/components/icons/Icons';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="flex items-center border rounded-full p-1 transition-colors border-border dark:border-dark-border focus:outline-none"
      aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
    >
      <span
        className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${theme === 'light' ? 'text-accent-foreground' : 'text-muted-foreground hover:bg-muted dark:hover:bg-dark-muted'}`}
      >
        <SunIcon className="w-5 h-5" />
      </span>
      <span
        className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${theme === 'dark' ? 'text-accent-foreground' : 'text-muted-foreground hover:bg-muted dark:hover:bg-dark-muted'}`}
      >
        <MoonIcon className="w-5 h-5" />
      </span>
    </button>
  );
};

export default ThemeToggle;
