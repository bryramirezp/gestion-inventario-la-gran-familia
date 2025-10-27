import { useState, useEffect } from 'react';

interface RechartsComponents {
  ResponsiveContainer: any;
  LineChart: any;
  BarChart: any;
  PieChart: any;
  Line: any;
  Bar: any;
  Pie: any;
  Cell: any;
  XAxis: any;
  YAxis: any;
  CartesianGrid: any;
  Tooltip: any;
  Legend: any;
}

export const useRecharts = () => {
  const [recharts, setRecharts] = useState<RechartsComponents | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRecharts = async () => {
      try {
        // Importar dinámicamente Recharts
        const rechartsModule = await import('recharts');

        setRecharts({
          ResponsiveContainer: rechartsModule.ResponsiveContainer,
          LineChart: rechartsModule.LineChart,
          BarChart: rechartsModule.BarChart,
          PieChart: rechartsModule.PieChart,
          Line: rechartsModule.Line,
          Bar: rechartsModule.Bar,
          Pie: rechartsModule.Pie,
          Cell: rechartsModule.Cell,
          XAxis: rechartsModule.XAxis,
          YAxis: rechartsModule.YAxis,
          CartesianGrid: rechartsModule.CartesianGrid,
          Tooltip: rechartsModule.Tooltip,
          Legend: rechartsModule.Legend,
        });
      } catch (err) {
        console.error('Error loading Recharts:', err);
        setError('Error al cargar los componentes de gráficos');
      } finally {
        setLoading(false);
      }
    };

    loadRecharts();
  }, []);

  return { recharts, loading, error };
};