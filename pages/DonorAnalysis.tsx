import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from '../components/Header';
import Table, { Column } from '../components/Table';
import { donorApi, getDonorTypes } from '../services/api';
import { DonorAnalysisData, DonorType } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { AnimatedWrapper } from '../components/Animated';
import { Badge } from '../components/Badge';
import { ProgressBar } from '../components/ProgressBar';
import { Input } from '../components/forms';
import useTableState from '../hooks/useTableState';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useRecharts } from '../hooks/useRecharts';

const DonorAnalysis: React.FC = () => {
  const { getToken } = useAuth();
  const { theme } = useTheme();
  const { recharts, loading: rechartsLoading, error: rechartsError } = useRecharts();
  const [analysisData, setAnalysisData] = useState<DonorAnalysisData[]>([]);
  const [donorTypes, setDonorTypes] = useState<DonorType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAnalysisData = useCallback(async () => {
    try {
      setLoading(true);
      const [data, types] = await Promise.all([
        donorApi.getAnalysis(''),
        getDonorTypes(''),
      ]);
      setAnalysisData(data);
      setDonorTypes(types);
    } catch (error) {
      console.error('Failed to fetch donor analysis', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalysisData();
  }, [fetchAnalysisData]);

  const filteredData = useMemo(() => {
    return analysisData.filter((d) =>
      d.donor_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [analysisData, searchTerm]);

  const contributionByTypeData = useMemo(() => {
    const typeMap = new Map(donorTypes.map((t) => [t.donor_type_id, t.type_name]));
    const byType = new Map<string, number>();

    analysisData.forEach((donor) => {
      const typeName = String(typeMap.get(donor.donor_type_id) || 'Desconocido');
      const currentValue = byType.get(typeName) || 0;
      byType.set(typeName, currentValue + donor.total_value_donated);
    });

    return Array.from(byType.entries()).map(([name, value]) => ({ name, value }));
  }, [analysisData, donorTypes]);

  const topDonorsData = useMemo(() => {
    return [...analysisData]
      .sort((a, b) => b.total_value_donated - a.total_value_donated)
      .slice(0, 5)
      .map((d) => ({ name: d.donor_name, value: d.total_value_donated }));
  }, [analysisData]);

  const chartTheme = {
    axis: {
      stroke: theme === 'dark' ? 'hsl(215 20% 65%)' : 'hsl(215 16% 46%)',
      tick: { fill: theme === 'dark' ? 'hsl(215 20% 65%)' : 'hsl(215 16% 46%)' },
    },
    grid: {
      stroke: theme === 'dark' ? 'hsl(215 28% 18%)' : 'hsl(215 20% 92%)',
    },
    tooltip: {
      background: theme === 'dark' ? 'hsl(222 47% 11%)' : 'hsl(0 0% 100%)',
      border: theme === 'dark' ? 'hsl(215 28% 18%)' : 'hsl(215 20% 88%)',
    },
  };

  const COLORS = ['#FF8042', '#0088FE', '#00C49F', '#FFBB28', '#AF19FF'];

  const columns: Column<DonorAnalysisData>[] = useMemo(
    () => [
      { header: 'Nombre del Donante', accessor: 'donor_name' },
      {
        header: 'Valor Total Donado',
        accessor: (item) =>
          `$${item.total_value_donated.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      },
      {
        header: 'Donaciones',
        accessor: (item) => <div className="text-center">{item.total_donations_count}</div>,
      },
      {
        header: 'Última Donación',
        accessor: (item) =>
          item.last_donation_date ? new Date(item.last_donation_date).toLocaleDateString() : 'N/A',
      },
      {
        header: 'Categoría Principal',
        accessor: (item) => <Badge variant="secondary">{item.top_donated_category}</Badge>,
      },
    ],
    []
  );

  const { orderedColumns, ...tableState } = useTableState<DonorAnalysisData>(
    columns,
    'donor-analysis-table'
  );

  if (loading || rechartsLoading) {
    return <div className="flex justify-center items-center h-full">Cargando análisis...</div>;
  }

  if (rechartsError || !recharts) {
    return (
      <AnimatedWrapper>
        <Header
          title="Análisis de Donantes"
          description="Métricas clave e información sobre las contribuciones de tus donantes."
        />
        <div className="text-center py-16">
          <p className="text-muted-foreground">
            No se pudo cargar las gráficas. Por favor, recarga la página.
          </p>
        </div>
      </AnimatedWrapper>
    );
  }

  const { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } =
    recharts;

  return (
    <AnimatedWrapper>
      <Header
        title="Análisis de Donantes"
        description="Métricas clave e información sobre las contribuciones de tus donantes."
      />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        <AnimatedWrapper delay={0.1} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Contribución por Tipo de Donante</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={contributionByTypeData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {contributionByTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartTheme.tooltip.background,
                        border: `1px solid ${chartTheme.tooltip.border}`,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </AnimatedWrapper>
        <AnimatedWrapper delay={0.2} className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Donantes por Valor</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={topDonorsData}
                    margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                  >
                    <XAxis dataKey="name" stroke={chartTheme.axis.stroke} tick={false} />
                    <YAxis stroke={chartTheme.axis.stroke} tick={chartTheme.axis.tick} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartTheme.tooltip.background,
                        border: `1px solid ${chartTheme.tooltip.border}`,
                      }}
                      formatter={(value: number) => `$${value.toLocaleString()}`}
                    />
                    <Legend />
                    <Bar dataKey="value" name="Total Donado" fill="#FF8042" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </AnimatedWrapper>
      </div>

      <Card>
        <CardHeader
          renderHeaderActions={() => (
            <Input
              placeholder="Buscar por nombre de donante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64"
            />
          )}
        >
          <CardTitle>Métricas de Todos los Donantes</CardTitle>
          <CardDescription>
            Mostrando {filteredData.length} de {analysisData.length} donantes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center p-4">Cargando datos de análisis...</p>
          ) : (
            <Table
              columns={orderedColumns}
              data={filteredData}
              getKey={(d) => d.donor_id}
              {...tableState}
            />
          )}
        </CardContent>
      </Card>
    </AnimatedWrapper>
  );
};

export default DonorAnalysis;
