/**
 * Hook para obtener los colores de gráficos del sistema de diseño
 * @returns Array de colores HSL para usar en gráficos (recharts, etc.)
 */
export const useChartColors = () => {
  return [
    'hsl(var(--chart-color-1))',  // Naranja principal
    'hsl(var(--chart-color-2))',  // Naranja oscuro
    'hsl(var(--chart-color-3))',  // Naranja claro
    'hsl(var(--chart-color-4))',  // Verde (success)
    'hsl(var(--chart-color-5))',  // Amarillo (warning)
  ];
};

