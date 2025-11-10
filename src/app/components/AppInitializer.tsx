import { useEffect } from 'react';

export const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Ocultar el fallback de carga una vez que React se monte
    const fallback = document.getElementById('loading-fallback');
    if (fallback) {
      fallback.style.display = 'none';
      console.log('Loading fallback hidden');
    }
  }, []);

  return <>{children}</>;
};

