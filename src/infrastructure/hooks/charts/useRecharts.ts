// Hook simplificado que maneja el estado de carga de recharts
// Los componentes se importarán directamente en cada página para evitar dependencias circulares
export const useRecharts = () => {
  return { loading: false, error: null };
};