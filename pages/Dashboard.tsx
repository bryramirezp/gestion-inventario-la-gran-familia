import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header';
import { useApiQuery } from '../hooks/useApiQuery';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  getFullProductDetails,
  warehouseApi,
  donorApi,
  donationApi,
} from '../services/api';
import {
  CubeIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  ClipboardListIcon,
} from '../components/icons/Icons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/Card';
import { AnimatedWrapper, AnimatedCounter } from '../components/Animated';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../hooks/useUserProfile';
import { Donation } from '../types';
import { Button } from '../components/Button';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
// Importar componentes de recharts directamente para evitar problemas de dependencias circulares
import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface DashboardStats {
  totalProducts: number;
  totalWarehouses: number;
  totalDonors: number;
  lowStockItems: number;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  delay: number;
  children?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = React.memo(
  ({ title, value, icon: Icon, delay, children }) => (
    <AnimatedWrapper delay={delay} direction="up">
      <Card className="border-l-4 border-l-primary shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1 hover:bg-card-hover">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            <AnimatedCounter value={value} />
          </div>
          {children}
        </CardContent>
      </Card>
    </AnimatedWrapper>
  )
);

const DefaultDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: userProfile } = useUserProfile();
  const { theme } = useTheme();
  // Los componentes de recharts ahora se importan directamente, no necesitamos el hook
  const rechartsLoading = false;
  const rechartsError = null;

  // Use React Query for data fetching with caching
  const { data: products, isLoading: productsLoading } = useApiQuery(
    ['products'],
    (token) => getFullProductDetails(token)
  );

  const { data: warehouses, isLoading: warehousesLoading } = useApiQuery(
    ['warehouses'],
    (token) => warehouseApi.getAll(token)
  );

  const { data: donors, isLoading: donorsLoading } = useApiQuery(
    ['donors'],
    (token) => donorApi.getAll(token)
  );

  const { data: donations, isLoading: donationsLoading } = useApiQuery(
    ['donations'],
    (token) => donationApi.getHistory(token)
  );

  const loading = productsLoading || warehousesLoading || donorsLoading || donationsLoading;

  // Memoize stats calculation
  const stats = useMemo((): DashboardStats | null => {
    if (!products || !warehouses || !donors) return null;

    const lowStockItems = products.filter(
      (p) => p.total_stock < p.low_stock_threshold
    ).length;

    return {
      totalProducts: products.length,
      totalWarehouses: warehouses.length,
      totalDonors: donors.length,
      lowStockItems: lowStockItems,
    };
  }, [products, warehouses, donors]);

  const donationChartData = useMemo(() => {
    if (!donations) return [];
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return {
        month: d.toLocaleString('es-ES', { month: 'short' }),
        total: 0,
        year: d.getFullYear(),
        monthNum: d.getMonth(),
      };
    }).reverse();

    donations.forEach((donation) => {
      const donationDate = new Date(donation.donation_date);
      const month = donationDate.getMonth();
      const year = donationDate.getFullYear();
      const monthData = last6Months.find((m) => m.monthNum === month && m.year === year);
      if (monthData) {
        monthData.total += donation.total_value_after_discount || 0;
      }
    });
    return last6Months;
  }, [donations]);

  const stockByCategoryChartData = useMemo(() => {
    if (!products) return [];
    const byCategory: { [key: string]: number } = {};
    products.forEach((p) => {
      byCategory[p.category_name] = (byCategory[p.category_name] || 0) + p.total_stock;
    });
    return Object.entries(byCategory).map(([name, stock]) => ({ name, stock }));
  }, [products]);

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

if (loading || rechartsLoading) {
    return <div className="flex justify-center items-center h-full">Cargando tablero...</div>;
  }

  // Los componentes de recharts ya están importados directamente
  // No necesitamos la verificación de error del hook ni la desestructuración

  return (
    <AnimatedWrapper>
      <Header title="Tablero" description="Resumen general del estado del inventario." />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Productos Totales"
          value={stats?.totalProducts ?? 0}
          icon={CubeIcon}
          delay={0.2}
        />
        <StatCard
          title="Almacenes"
          value={stats?.totalWarehouses ?? 0}
          icon={BuildingStorefrontIcon}
          delay={0.3}
        />
        <StatCard
          title="Donantes"
          value={stats?.totalDonors ?? 0}
          icon={UserGroupIcon}
          delay={0.4}
        />
        <StatCard
          title="Productos con Stock Bajo"
          value={stats?.lowStockItems ?? 0}
          icon={ExclamationTriangleIcon}
          delay={0.5}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <AnimatedWrapper delay={0.6}>
          <Card>
            <CardHeader>
              <CardTitle>Donaciones a lo largo del Tiempo</CardTitle>
              <CardDescription>
                Valor total de donaciones recibidas en los últimos 6 meses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={donationChartData}>
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
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Valor Total"
                      stroke="hsl(31 72% 56%)"
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </AnimatedWrapper>
        <AnimatedWrapper delay={0.7}>
          <Card>
            <CardHeader>
              <CardTitle>Stock por Categoría</CardTitle>
              <CardDescription>Número total de artículos en cada categoría.</CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={stockByCategoryChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid.stroke} />
                    <XAxis
                      type="number"
                      stroke={chartTheme.axis.stroke}
                      tick={chartTheme.axis.tick}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      stroke={chartTheme.axis.stroke}
                      tick={chartTheme.axis.tick}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartTheme.tooltip.background,
                        border: `1px solid ${chartTheme.tooltip.border}`,
                      }}
                    />
                    <Bar dataKey="stock" name="Artículos Totales" fill="hsl(31 72% 56%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </AnimatedWrapper>
      </div>
    </AnimatedWrapper>
  );
};

const NutritionistDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: userProfile } = useUserProfile();

  const { data: products, isLoading: productsLoading } = useApiQuery(
    ['products'],
    (token) => getFullProductDetails(token)
  );

  const loading = productsLoading;

  const stats = useMemo(() => {
    if (!products) return { menusNext7Days: 0, lowStockItems: 0, expiringSoon: 0 };

    return {
      menusNext7Days: 0, // Sin menús disponibles
      lowStockItems: products.filter((p) => p.total_stock < p.low_stock_threshold).length,
      expiringSoon: products.filter(
        (p) => p.days_to_expiry !== null && p.days_to_expiry <= 30 && p.days_to_expiry >= 0
      ).length,
    };
  }, [products]);

  const todayMenu = useMemo(() => {
    return null; // Sin menús disponibles
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-full">Cargando tablero...</div>;
  }

  return (
    <AnimatedWrapper>
      <Header
        title="Tablero de Consultor"
        description={`Bienvenida de nuevo, ${userProfile?.full_name}. Aquí está tu resumen diario.`}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Consultas Disponibles"
          value={stats.menusNext7Days}
          icon={CalendarIcon}
          delay={0.1}
        >
          <p className="text-xs text-muted-foreground mt-1">Funcionalidades de consulta activas.</p>
        </StatCard>
        <StatCard
          title="Artículos con Stock Bajo"
          value={stats.lowStockItems}
          icon={CubeIcon}
          delay={0.2}
        >
          <p className="text-xs text-muted-foreground mt-1">
            Puede afectar la planeación de menús.
          </p>
        </StatCard>
        <StatCard
          title="Artículos Próximos a Caducar"
          value={stats.expiringSoon}
          icon={ExclamationTriangleIcon}
          delay={0.3}
        >
          <p className="text-xs text-muted-foreground mt-1">Prioriza estos en nuevos menús.</p>
        </StatCard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Información de Consulta:{' '}
            {new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-muted-foreground">
            <ClipboardListIcon className="mx-auto h-12 w-12" />
            <h3 className="mt-2 text-sm font-medium text-foreground">
              Información de Consulta Disponible
            </h3>
            <p className="mt-1 text-sm">Accede a las funcionalidades de consulta en la sección de cocina.</p>
            <Button as={Link} to="/kitchen" size="sm" className="mt-4">
              Ir a Consultas
            </Button>
          </div>
        </CardContent>
      </Card>
    </AnimatedWrapper>
  );
};

const Dashboard: React.FC = () => {
  const { user, loading } = useAuth();
  const { data: userProfile, isLoading: isProfileLoading } = useUserProfile();

  if (loading || isProfileLoading) {
    return <LoadingSpinner size="lg" message="Cargando dashboard..." fullScreen />;
  }

  if (userProfile?.role_name === 'Consultor') {
    return <NutritionistDashboard />;
  }

  return <DefaultDashboard />;
};

export default Dashboard;
