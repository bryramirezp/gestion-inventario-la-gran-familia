import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from '@/presentation/components/layout/Header';
import Table, { Column } from '@/presentation/components/ui/Table';
import { donorApi, getDonorTypes, donationApi } from '@/data/api';
import { DonorAnalysisData, DonorType, Donation } from '@/domain/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/presentation/components/ui/Card';
import { AnimatedWrapper } from '@/presentation/components/animated/Animated';
import { Badge } from '@/presentation/components/ui/Badge';
import { Input } from '@/presentation/components/forms';
import useTableState from '@/infrastructure/hooks/useTableState';
import { useAuth } from '@/app/providers/AuthProvider';
import LoadingSpinner from '@/presentation/components/ui/LoadingSpinner';
import { useChartColors } from '@/infrastructure/hooks/charts/useChartColors';
import { useChartTheme } from '@/infrastructure/hooks/charts/useChartTheme';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { ResponsiveChart } from '@/presentation/components/ui/ResponsiveChart';

const DonorAnalysis: React.FC = () => {
  const { getToken } = useAuth();
  const [analysisData, setAnalysisData] = useState<DonorAnalysisData[]>([]);
  const [donorTypes, setDonorTypes] = useState<DonorType[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const chartColors = useChartColors();
  const chartTheme = useChartTheme();

  const fetchAnalysisData = useCallback(async () => {
    try {
      setLoading(true);
      const token = getToken() || '';
      const [data, types, donationsData] = await Promise.all([
        donorApi.getAnalysis(token),
        getDonorTypes(token),
        donationApi.getHistory(token),
      ]);
      setAnalysisData(data);
      setDonorTypes(types);
      setDonations(donationsData);
    } catch (error) {
      console.error('Error al cargar análisis de donantes:', error);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchAnalysisData();
  }, [fetchAnalysisData]);

  const filteredData = useMemo(() => {
    return analysisData.filter((d) =>
      d.donor_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [analysisData, searchTerm]);

  // Contribución por Tipo de Donante
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

  // Top 10 Donantes por Valor
  const topDonorsData = useMemo(() => {
    return analysisData.slice(0, 10).map((d) => ({
      name: d.donor_name.length > 20 ? d.donor_name.substring(0, 20) + '...' : d.donor_name,
      value: d.total_value_donated,
      fullName: d.donor_name,
    }));
  }, [analysisData]);

  // Valor de Mercado vs Valor Real (Top 10)
  const marketVsActualData = useMemo(() => {
    return analysisData.slice(0, 10).map((d) => ({
      name: d.donor_name.length > 15 ? d.donor_name.substring(0, 15) + '...' : d.donor_name,
      'Valor Real': d.total_value_donated,
      'Valor Mercado': d.total_market_value,
      fullName: d.donor_name,
    }));
  }, [analysisData]);

  // Tendencia Temporal (Donaciones por mes)
  const temporalTrendData = useMemo(() => {
    const monthlyData = new Map<string, { count: number; value: number; marketValue: number }>();

    donations.forEach((donation) => {
      const date = new Date(donation.donation_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('es-MX', { year: 'numeric', month: 'short' });

      const current = monthlyData.get(monthKey) || { count: 0, value: 0, marketValue: 0 };
      monthlyData.set(monthKey, {
        count: current.count + 1,
        value: current.value + (donation.total_actual_value || 0),
        marketValue: current.marketValue + (donation.total_market_value || 0),
      });
    });

    return Array.from(monthlyData.entries())
      .map(([key, data]) => ({
        month: key.split('-')[1] + '/' + key.split('-')[0].substring(2),
        monthLabel: key,
        count: data.count,
        value: data.value,
        marketValue: data.marketValue,
      }))
      .sort((a, b) => a.monthLabel.localeCompare(b.monthLabel))
      .slice(-12); // Últimos 12 meses
  }, [donations]);

  // Métricas de resumen
  const summaryMetrics = useMemo(() => {
    const totalDonors = analysisData.length;
    const activeDonors = analysisData.filter((d) => d.recent_donations_count > 0).length;
    const totalValue = analysisData.reduce((sum, d) => sum + d.total_value_donated, 0);
    const totalMarketValue = analysisData.reduce((sum, d) => sum + d.total_market_value, 0);
    const avgFrequency =
      analysisData
        .filter((d) => d.donation_frequency_days !== null)
        .reduce((sum, d) => sum + (d.donation_frequency_days || 0), 0) /
      analysisData.filter((d) => d.donation_frequency_days !== null).length;

    return {
      totalDonors,
      activeDonors,
      totalValue,
      totalMarketValue,
      avgFrequency: avgFrequency || 0,
    };
  }, [analysisData]);

  const columns: Column<DonorAnalysisData>[] = useMemo(
    () => [
      {
        header: 'Ranking',
        accessor: (item) => (
          <div className="text-center font-semibold">#{item.ranking_position}</div>
        ),
      },
      { header: 'Nombre del Donante', accessor: 'donor_name' },
      {
        header: 'Valor Total Donado',
        accessor: (item) =>
          `$${item.total_value_donated.toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
      },
      {
        header: 'Valor Mercado',
        accessor: (item) =>
          `$${item.total_market_value.toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
      },
      {
        header: 'Valor Promedio',
        accessor: (item) =>
          `$${item.average_donation_value.toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
      },
      {
        header: 'Donaciones',
        accessor: (item) => <div className="text-center">{item.total_donations_count}</div>,
      },
      {
        header: 'Frecuencia (días)',
        accessor: (item) => (
          <div className="text-center">
            {item.donation_frequency_days
              ? `${Math.round(item.donation_frequency_days)} días`
              : 'N/A'}
          </div>
        ),
      },
      {
        header: 'Actividad (90d)',
        accessor: (item) => (
          <div className="text-center">
            <Badge variant={item.recent_donations_count > 0 ? 'default' : 'secondary'}>
              {item.recent_donations_count}
            </Badge>
          </div>
        ),
      },
      {
        header: 'Primera Donación',
        accessor: (item) =>
          item.first_donation_date
            ? new Date(item.first_donation_date).toLocaleDateString('es-MX')
            : 'N/A',
      },
      {
        header: 'Última Donación',
        accessor: (item) =>
          item.last_donation_date
            ? new Date(item.last_donation_date).toLocaleDateString('es-MX')
            : 'N/A',
      },
      {
        header: 'Contribución %',
        accessor: (item) => (
          <div className="text-center">{item.contribution_percentage.toFixed(2)}%</div>
        ),
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

  if (loading) {
    return <LoadingSpinner size="lg" message="Cargando análisis..." centerScreen />;
  }

  return (
    <AnimatedWrapper>
      <Header
        title="Análisis de Donantes"
        description="Métricas clave e información sobre las contribuciones de tus donantes."
      />

      {/* Métricas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Donantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryMetrics.totalDonors}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Donantes Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryMetrics.activeDonors}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Últimos 90 días
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summaryMetrics.totalValue.toLocaleString('es-MX', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor Mercado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summaryMetrics.totalMarketValue.toLocaleString('es-MX', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Frecuencia Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryMetrics.avgFrequency > 0
                ? `${Math.round(summaryMetrics.avgFrequency)} días`
                : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <AnimatedWrapper delay={0.1}>
          <Card>
            <CardHeader>
              <CardTitle>Contribución por Tipo de Donante</CardTitle>
              <CardDescription>Distribución del valor total por tipo de donante</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveChart minHeight={300} maxHeight={400}>
                <PieChart>
                  <Pie
                    data={contributionByTypeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.name}: $${entry.value.toLocaleString()}`}
                  >
                    {contributionByTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartTheme.tooltip.background,
                      border: `1px solid ${chartTheme.tooltip.border}`,
                      color: 'hsl(var(--foreground))',
                    }}
                    formatter={(value: number) => `$${value.toLocaleString('es-MX')}`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveChart>
            </CardContent>
          </Card>
        </AnimatedWrapper>

        <AnimatedWrapper delay={0.2}>
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Donantes por Valor</CardTitle>
              <CardDescription>Los 10 donantes con mayor valor total donado</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveChart minHeight={300} maxHeight={400}>
                <BarChart data={topDonorsData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid.stroke} />
                  <XAxis
                    dataKey="name"
                    stroke={chartTheme.axis.stroke}
                    tick={chartTheme.axis.tick}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke={chartTheme.axis.stroke} tick={chartTheme.axis.tick} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartTheme.tooltip.background,
                      border: `1px solid ${chartTheme.tooltip.border}`,
                    }}
                    formatter={(value: number, _name: string, props: any) => [
                      `$${value.toLocaleString('es-MX')}`,
                      props.payload.fullName,
                    ]}
                  />
                  <Legend wrapperStyle={{ paddingTop: '90px' }} />
                  <Bar dataKey="value" name="Total Donado" fill={chartColors[0]} />
                </BarChart>
              </ResponsiveChart>
            </CardContent>
          </Card>
        </AnimatedWrapper>
      </div>

      {/* Gráficos de Análisis Detallado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <AnimatedWrapper delay={0.3}>
          <Card>
            <CardHeader>
              <CardTitle>Valor de Mercado vs Valor Real</CardTitle>
              <CardDescription>Comparativa del valor de mercado y valor real (Top 10)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveChart minHeight={300} maxHeight={400}>
                <BarChart data={marketVsActualData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid.stroke} />
                  <XAxis
                    dataKey="name"
                    stroke={chartTheme.axis.stroke}
                    tick={chartTheme.axis.tick}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke={chartTheme.axis.stroke} tick={chartTheme.axis.tick} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartTheme.tooltip.background,
                      border: `1px solid ${chartTheme.tooltip.border}`,
                    }}
                    formatter={(value: number) => `$${value.toLocaleString('es-MX')}`}
                  />
                  <Legend wrapperStyle={{ paddingTop: '90px' }} />
                  <Bar dataKey="Valor Real" fill={chartColors[0]} />
                  <Bar dataKey="Valor Mercado" fill={chartColors[1]} />
                </BarChart>
              </ResponsiveChart>
            </CardContent>
          </Card>
        </AnimatedWrapper>

        <AnimatedWrapper delay={0.4}>
          <Card>
            <CardHeader>
              <CardTitle>Tendencia Temporal de Donaciones</CardTitle>
              <CardDescription>Evolución de donaciones por mes (últimos 12 meses)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveChart minHeight={300} maxHeight={400}>
                <LineChart data={temporalTrendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid.stroke} />
                  <XAxis
                    dataKey="month"
                    stroke={chartTheme.axis.stroke}
                    tick={chartTheme.axis.tick}
                  />
                  <YAxis
                    stroke={chartTheme.axis.stroke}
                    tick={chartTheme.axis.tick}
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartTheme.tooltip.background,
                      border: `1px solid ${chartTheme.tooltip.border}`,
                    }}
                    formatter={(value: number) => `$${value.toLocaleString('es-MX')}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name="Valor Real"
                    stroke={chartColors[0]}
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="marketValue"
                    name="Valor Mercado"
                    stroke={chartColors[1]}
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveChart>
            </CardContent>
          </Card>
        </AnimatedWrapper>
      </div>

      {/* Tabla de Métricas */}
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
          <CardTitle>Métricas Detalladas de Todos los Donantes</CardTitle>
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
