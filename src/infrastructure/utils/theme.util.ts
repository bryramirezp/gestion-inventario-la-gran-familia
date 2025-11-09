/**
 * Initialize theme before React renders to prevent flash of wrong theme
 * This replaces the inline script in index.html for CSP compliance
 */
export function initializeTheme(): void {
  const theme = localStorage.getItem('inventory-theme');
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  }
}

// Execute immediately when this module is loaded
initializeTheme();

