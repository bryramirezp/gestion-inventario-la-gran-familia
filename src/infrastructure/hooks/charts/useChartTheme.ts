import { useTheme } from '@/app/providers/ThemeProvider';

/**
 * Hook para obtener el tema de gráficos basado en el tema actual (light/dark)
 * @returns Objeto con configuraciones de tema para gráficos (recharts, etc.)
 */
export const useChartTheme = () => {
  const { theme } = useTheme();
  
  return {
    axis: {
      stroke: 'hsl(var(--muted-foreground))',
      tick: { fill: 'hsl(var(--muted-foreground))' },
    },
    grid: {
      stroke: 'hsl(var(--border))',
    },
    tooltip: {
      background: 'hsl(var(--card))',
      border: 'hsl(var(--border))',
    },
  };
};

