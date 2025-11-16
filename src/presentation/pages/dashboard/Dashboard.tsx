import React, { useMemo } from 'react';
import Header from '@/presentation/components/layout/Header';
import { useApiQuery } from '@/infrastructure/hooks/useApiQuery';
import LoadingSpinner from '@/presentation/components/ui/LoadingSpinner';
import {
  getFullProductDetails,
  warehouseApi,
  donorApi,
  donationApi,
  stockLotApi,
  transferApi,
  stockMovementApi,
  adjustmentApi,
} from '@/data/api';
import {
  CubeIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  ClipboardListIcon,
  ArrowsRightLeftIcon,
} from '@/presentation/components/icons/Icons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/presentation/components/ui/Card';
import { Badge } from '@/presentation/components/ui/Badge';
import { AnimatedWrapper, AnimatedCounter } from '@/presentation/components/animated/Animated';
import { useAuth } from '@/app/providers/AuthProvider';
import { useUserProfile } from '@/infrastructure/hooks/useUserProfile';
// import { Donation } from '../types';
import { Button } from '@/presentation/components/ui/Button';
import { Link } from 'react-router-dom';
import { useTheme } from '@/app/providers/ThemeProvider';
import { StockTransferWithDetails, StockMovementWithType, InventoryAdjustmentWithDetails } from '@/domain/types';
import { ROUTES } from '@/shared/constants';
// Importar componentes de recharts directamente para evitar problemas de dependencias circulares
import {
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
import { ResponsiveChart } from '@/presentation/components/ui/ResponsiveChart';

interface DashboardStats {
  totalProducts: number;
  totalWarehouses: number;
  totalDonors: number;
  lowStockItems: number;
  expiringProducts: number;
  totalInventoryValue: number;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  delay: number;
  format?: 'number' | 'currency';
  children?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = React.memo(
  ({ title, value, icon: Icon, delay, format = 'number', children }) => (
    <AnimatedWrapper delay={delay} direction="up">
      <Card className="border-l-4 border-l-primary shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1 hover:bg-card-hover">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {format === 'currency' ? (
              `$${value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            ) : (
              <AnimatedCounter value={value} />
            )}
          </div>
          {children}
        </CardContent>
      </Card>
    </AnimatedWrapper>
  )
);

const DefaultDashboard: React.FC = () => {
  const { data: userProfile } = useUserProfile();
  const { theme } = useTheme();

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

  const { data: stockLots, isLoading: stockLotsLoading } = useApiQuery(
    ['stockLots'],
    (token) => stockLotApi.getAll(token)
  );

  const { data: donorAnalysis, isLoading: donorAnalysisLoading } = useApiQuery(
    ['donorAnalysis'],
    (token) => donorApi.getAnalysis(token)
  );

  // Obtener traspasos pendientes (solo para Admin)
  const { data: pendingTransfers = [] } = useApiQuery<StockTransferWithDetails[]>(
    ['transfers', 'pending'],
    (token) => transferApi.getPending(token),
    {
      enabled: userProfile?.role_name === 'Administrador',
      staleTime: 30 * 1000,
      refetchInterval: 60 * 1000, // Refrescar cada minuto
    }
  );

  // Obtener ajustes pendientes (solo para Admin)
  const { data: pendingAdjustments = [] } = useApiQuery<InventoryAdjustmentWithDetails[]>(
    ['adjustments', 'pending'],
    (token) => adjustmentApi.getPending(token),
    {
      enabled: userProfile?.role_name === 'Administrador',
      staleTime: 30 * 1000,
      refetchInterval: 60 * 1000, // Refrescar cada minuto
    }
  );

  // Obtener movimientos recientes
  const { data: recentMovements = [] } = useApiQuery<StockMovementWithType[]>(
    ['movements', 'recent'],
    (token) => stockMovementApi.getAll(token, { limit: 20 }),
    {
      staleTime: 30 * 1000,
    }
  );

  const loading =
    productsLoading ||
    warehousesLoading ||
    donorsLoading ||
    donationsLoading ||
    stockLotsLoading ||
    donorAnalysisLoading;

  // Memoize stats calculation
  const stats = useMemo((): DashboardStats | null => {
    if (!products || !warehouses || !donors || !stockLots) return null;

    const lowStockItems = products.filter(
      (p) => p.total_stock < p.low_stock_threshold
    ).length;

    const expiringProducts = products.filter(
      (p) => p.days_to_expiry !== null && p.days_to_expiry <= 30 && p.days_to_expiry >= 0
    ).length;

    const totalInventoryValue = stockLots.reduce(
      (sum, lot) => sum + (lot.unit_price || 0) * Number(lot.current_quantity),
      0
    );

    return {
      totalProducts: products.length,
      totalWarehouses: warehouses.length,
      totalDonors: donors.length,
      lowStockItems: lowStockItems,
      expiringProducts: expiringProducts,
      totalInventoryValue: totalInventoryValue,
    };
  }, [products, warehouses, donors, stockLots]);

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
        monthData.total += donation.actual_value || 0;
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

  // Productos próximos a vencer (barras)
  const expiringProductsChartData = useMemo(() => {
    if (!products) return [];
    const expiring = products.filter(
      (p) => p.days_to_expiry !== null && p.days_to_expiry <= 30 && p.days_to_expiry >= 0
    );
    
    // Agrupar por rangos de días
    const ranges = [
      { name: '0-7 días', min: 0, max: 7, count: 0 },
      { name: '8-15 días', min: 8, max: 15, count: 0 },
      { name: '16-30 días', min: 16, max: 30, count: 0 },
    ];

    expiring.forEach((p) => {
      const days = p.days_to_expiry!;
      const range = ranges.find((r) => days >= r.min && days <= r.max);
      if (range) range.count++;
    });

    return ranges.filter((r) => r.count > 0);
  }, [products]);


  // Top donantes
  const topDonorsData = useMemo(() => {
    if (!donorAnalysis) return [];
    return donorAnalysis
      .filter((d) => d.total_value_donated > 0)
      .sort((a, b) => b.total_value_donated - a.total_value_donated)
      .slice(0, 5)
      .map((d) => ({
        name: d.donor_name,
        value: d.total_value_donated,
        count: d.total_donations_count,
      }));
  }, [donorAnalysis]);

  // Productos más donados
  const topDonatedProductsData = useMemo(() => {
    if (!donations) return [];
    const productCounts: { [key: number]: { name: string; quantity: number } } = {};

    donations.forEach((donation) => {
      donation.items.forEach((item) => {
        const productId = item.product_id;
        if (!productCounts[productId]) {
          productCounts[productId] = {
            name: item.product_name || 'Producto Desconocido',
            quantity: 0,
          };
        }
        productCounts[productId].quantity += Number(item.quantity);
      });
    });

    return Object.values(productCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
      .map((p) => ({
        name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
        quantity: p.quantity,
      }));
  }, [donations]);

  // Distribución por almacén
  const stockByWarehouseData = useMemo(() => {
    if (!stockLots || !warehouses) return [];
    const warehouseMap = new Map(warehouses.map((w) => [w.warehouse_id, w.warehouse_name]));
    const warehouseData: { [key: number]: { name: string; value: number; items: number } } = {};

    stockLots.forEach((lot) => {
      const warehouseId = lot.warehouse_id;
      if (!warehouseData[warehouseId]) {
        warehouseData[warehouseId] = {
          name: warehouseMap.get(warehouseId) || 'Almacén Desconocido',
          value: 0,
          items: 0,
        };
      }
      const lotValue = (lot.unit_price || 0) * Number(lot.current_quantity);
      warehouseData[warehouseId].value += lotValue;
      warehouseData[warehouseId].items += Number(lot.current_quantity);
    });

    return Object.values(warehouseData)
      .sort((a, b) => b.value - a.value)
      .map((w) => ({
        name: w.name,
        value: w.value,
        items: w.items,
      }));
  }, [stockLots, warehouses]);


  const chartTheme = {
    axis: {
      stroke: theme === 'dark' ? 'hsl(215 20% 80%)' : 'hsl(215 16% 30%)',
      tick: { 
        fill: theme === 'dark' ? 'hsl(215 20% 80%)' : 'hsl(215 16% 30%)',
        fontSize: 13,
        fontWeight: 500,
      },
    },
    grid: {
      stroke: theme === 'dark' ? 'hsl(215 28% 25%)' : 'hsl(215 20% 85%)',
      strokeWidth: 1,
    },
    tooltip: {
      background: theme === 'dark' ? 'hsl(222 47% 15%)' : 'hsl(0 0% 100%)',
      border: theme === 'dark' ? 'hsl(215 28% 30%)' : 'hsl(215 20% 75%)',
      padding: '12px',
      fontSize: '14px',
      borderRadius: '8px',
    },
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Cargando tablero..." centerScreen />;
  }

  // Los componentes de recharts ya están importados directamente
  // No necesitamos la verificación de error del hook ni la desestructuración

  return (
    <AnimatedWrapper>
      <Header title="Tablero" description="Resumen general del estado del inventario." />
      {/* Tarjetas de métricas clave */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Productos Próximos a Vencer"
          value={stats?.expiringProducts ?? 0}
          icon={ExclamationTriangleIcon}
          delay={0.2}
        >
          <p className="text-xs text-muted-foreground mt-1">Próximos 30 días</p>
        </StatCard>
        <StatCard
          title="Valor Total de Inventario"
          value={stats?.totalInventoryValue ?? 0}
          icon={BuildingStorefrontIcon}
          delay={0.3}
          format="currency"
        >
          <p className="text-xs text-muted-foreground mt-1">Valor actual en almacenes en relación al mercado</p>
        </StatCard>
        <StatCard
          title="Productos con Stock Bajo"
          value={stats?.lowStockItems ?? 0}
          icon={CubeIcon}
          delay={0.4}
        >
          <p className="text-xs text-muted-foreground mt-1">Necesitan reposición</p>
        </StatCard>
        <StatCard
          title="Donantes"
          value={stats?.totalDonors ?? 0}
          icon={UserGroupIcon}
          delay={0.5}
        >
          <p className="text-xs text-muted-foreground mt-1">Total registrados</p>
        </StatCard>
        {userProfile?.role_name === 'Administrador' && (
          <StatCard
            title="Traspasos Pendientes"
            value={pendingTransfers.length}
            icon={ArrowsRightLeftIcon}
            delay={0.6}
          >
            <p className="text-xs text-muted-foreground mt-1">
              <Link to={ROUTES.TRANSFERS_APPROVE} className="text-primary hover:underline">
                Requieren aprobación
              </Link>
            </p>
          </StatCard>
        )}
      </div>
      {/* Gráficos principales */}
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
              <ResponsiveChart minHeight={250} maxHeight={350}>
                <LineChart data={donationChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid.stroke} />
                  <XAxis
                    dataKey="month"
                    stroke={chartTheme.axis.stroke}
                    tick={{ ...chartTheme.axis.tick }}
                    style={{ fontSize: chartTheme.axis.tick.fontSize }}
                  />
                  <YAxis
                    stroke={chartTheme.axis.stroke}
                    tick={{ ...chartTheme.axis.tick }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    style={{ fontSize: chartTheme.axis.tick.fontSize }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartTheme.tooltip.background,
                      border: `1px solid ${chartTheme.tooltip.border}`,
                      padding: chartTheme.tooltip.padding,
                      fontSize: chartTheme.tooltip.fontSize,
                      borderRadius: chartTheme.tooltip.borderRadius,
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 'Valor Total']}
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
              </ResponsiveChart>
            </CardContent>
          </Card>
        </AnimatedWrapper>
        <AnimatedWrapper delay={0.7}>
          <Card>
            <CardHeader>
              <CardTitle>Productos Próximos a Vencer</CardTitle>
              <CardDescription>Cantidad de productos por rango de días hasta caducidad.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveChart minHeight={250} maxHeight={350}>
                <BarChart data={expiringProductsChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid.stroke} />
                  <XAxis
                    dataKey="name"
                    stroke={chartTheme.axis.stroke}
                    tick={{ ...chartTheme.axis.tick }}
                    style={{ fontSize: chartTheme.axis.tick.fontSize }}
                  />
                  <YAxis
                    stroke={chartTheme.axis.stroke}
                    tick={{ ...chartTheme.axis.tick }}
                    style={{ fontSize: chartTheme.axis.tick.fontSize }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartTheme.tooltip.background,
                      border: `1px solid ${chartTheme.tooltip.border}`,
                      padding: chartTheme.tooltip.padding,
                      fontSize: chartTheme.tooltip.fontSize,
                      borderRadius: chartTheme.tooltip.borderRadius,
                    }}
                  />
                  <Bar dataKey="count" name="Productos" fill="hsl(0 84% 60%)" />
                </BarChart>
              </ResponsiveChart>
            </CardContent>
          </Card>
        </AnimatedWrapper>
      </div>

      {/* Vista secundaria - Análisis estratégico */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <AnimatedWrapper delay={0.9}>
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Donantes</CardTitle>
              <CardDescription>Donantes con mayor valor total donado.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveChart minHeight={250} maxHeight={350}>
                <BarChart data={topDonorsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid.stroke} />
                  <XAxis
                    type="number"
                    stroke={chartTheme.axis.stroke}
                    tick={{ ...chartTheme.axis.tick }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    style={{ fontSize: chartTheme.axis.tick.fontSize }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={140}
                    stroke={chartTheme.axis.stroke}
                    tick={{ ...chartTheme.axis.tick }}
                    style={{ fontSize: chartTheme.axis.tick.fontSize }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartTheme.tooltip.background,
                      border: `1px solid ${chartTheme.tooltip.border}`,
                      padding: chartTheme.tooltip.padding,
                      fontSize: chartTheme.tooltip.fontSize,
                      borderRadius: chartTheme.tooltip.borderRadius,
                    }}
                    formatter={(value: number, _: any, props: any) => [
                      `$${value.toLocaleString('es-ES', { minimumFractionDigits: 2 })} (${props.payload.count} donaciones)`,
                      'Valor Total',
                    ]}
                  />
                  <Bar dataKey="value" name="Valor Donado" fill="hsl(142 76% 36%)" />
                </BarChart>
              </ResponsiveChart>
            </CardContent>
          </Card>
        </AnimatedWrapper>
        <AnimatedWrapper delay={1.0}>
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Productos Más Donados</CardTitle>
              <CardDescription>Productos con mayor cantidad recibida en donaciones.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveChart minHeight={250} maxHeight={350}>
                <BarChart data={topDonatedProductsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid.stroke} />
                  <XAxis
                    type="number"
                    stroke={chartTheme.axis.stroke}
                    tick={{ ...chartTheme.axis.tick }}
                    style={{ fontSize: chartTheme.axis.tick.fontSize }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={140}
                    stroke={chartTheme.axis.stroke}
                    tick={{ ...chartTheme.axis.tick }}
                    style={{ fontSize: chartTheme.axis.tick.fontSize }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartTheme.tooltip.background,
                      border: `1px solid ${chartTheme.tooltip.border}`,
                      padding: chartTheme.tooltip.padding,
                      fontSize: chartTheme.tooltip.fontSize,
                      borderRadius: chartTheme.tooltip.borderRadius,
                    }}
                  />
                  <Bar dataKey="quantity" name="Cantidad" fill="hsl(217 91% 60%)" />
                </BarChart>
              </ResponsiveChart>
            </CardContent>
          </Card>
        </AnimatedWrapper>
        <AnimatedWrapper delay={1.1}>
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Almacén</CardTitle>
              <CardDescription>Valor del inventario distribuido por almacén.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveChart minHeight={250} maxHeight={350}>
                <BarChart data={stockByWarehouseData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid.stroke} />
                  <XAxis
                    dataKey="name"
                    stroke={chartTheme.axis.stroke}
                    tick={{ ...chartTheme.axis.tick }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    style={{ fontSize: chartTheme.axis.tick.fontSize }}
                  />
                  <YAxis
                    stroke={chartTheme.axis.stroke}
                    tick={{ ...chartTheme.axis.tick }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    style={{ fontSize: chartTheme.axis.tick.fontSize }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: chartTheme.tooltip.background,
                      border: `1px solid ${chartTheme.tooltip.border}`,
                      padding: chartTheme.tooltip.padding,
                      fontSize: chartTheme.tooltip.fontSize,
                      borderRadius: chartTheme.tooltip.borderRadius,
                    }}
                    formatter={(value: number, _: any, props: any) => [
                      `$${value.toLocaleString('es-ES', { minimumFractionDigits: 2 })} (${props.payload.items.toLocaleString()} items)`,
                      'Valor',
                    ]}
                  />
                  <Bar dataKey="value" name="Valor del Inventario" fill="hsl(280 100% 70%)" />
                </BarChart>
              </ResponsiveChart>
            </CardContent>
          </Card>
        </AnimatedWrapper>

        {/* Widget de Traspasos Pendientes (Solo Admin) */}
        {userProfile?.role_name === 'Administrador' && pendingTransfers.length > 0 && (
          <AnimatedWrapper delay={0.8}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Traspasos Pendientes</CardTitle>
                    <CardDescription>
                      {pendingTransfers.length} traspaso(s) pendiente(s) de aprobación
                    </CardDescription>
                  </div>
                  <Button as={Link} to={ROUTES.TRANSFERS_APPROVE} variant="outline" size="sm">
                    Ver Todos
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {pendingTransfers.slice(0, 5).map((transfer) => (
                    <div
                      key={transfer.transfer_id}
                      className="p-3 border rounded-lg hover:bg-muted dark:hover:bg-dark-muted transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-sm">
                            Lote #{transfer.lot_id} - {transfer.quantity} unidades
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {transfer.from_warehouse?.warehouse_name} → {transfer.to_warehouse?.warehouse_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Solicitado por: {transfer.requested_by_user?.full_name || 'N/A'} -{' '}
                            {new Date(transfer.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant="warning" className="ml-2">
                          Pendiente
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                {pendingTransfers.length > 5 && (
                  <div className="mt-4 text-center">
                    <Button as={Link} to={ROUTES.TRANSFERS_APPROVE} variant="outline" size="sm">
                      Ver {pendingTransfers.length - 5} más...
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </AnimatedWrapper>
        )}

        {/* Widget de Ajustes Pendientes (Solo Admin) */}
        {userProfile?.role_name === 'Administrador' && pendingAdjustments.length > 0 && (
          <AnimatedWrapper delay={0.9}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Ajustes Pendientes</CardTitle>
                    <CardDescription>
                      {pendingAdjustments.length} ajuste(s) pendiente(s) de aprobación
                    </CardDescription>
                  </div>
                  <Button as={Link} to={ROUTES.ADJUSTMENTS_APPROVE} variant="outline" size="sm">
                    Ver Todos
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {pendingAdjustments.slice(0, 5).map((adjustment) => {
                    const lot = adjustment.lot as any;
                    return (
                      <div
                        key={adjustment.adjustment_id}
                        className="p-3 border rounded-lg hover:bg-muted dark:hover:bg-dark-muted transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-sm">
                              Lote #{adjustment.lot_id} - Ajuste de {adjustment.quantity_before?.toFixed(2) || 'N/A'} a{' '}
                              {adjustment.quantity_after.toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Diferencia:{' '}
                              <span
                                className={
                                  (adjustment.quantity_after - (adjustment.quantity_before || 0)) >= 0
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400'
                                }
                              >
                                {(adjustment.quantity_after - (adjustment.quantity_before || 0)) >= 0 ? '+' : ''}
                                {(adjustment.quantity_after - (adjustment.quantity_before || 0)).toFixed(2)}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Solicitado por: {adjustment.created_by_user?.full_name || 'N/A'} -{' '}
                              {new Date(adjustment.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <Badge variant="warning" className="ml-2">
                            Pendiente
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {pendingAdjustments.length > 5 && (
                  <div className="mt-4 text-center">
                    <Button as={Link} to={ROUTES.ADJUSTMENTS_APPROVE} variant="outline" size="sm">
                      Ver {pendingAdjustments.length - 5} más...
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </AnimatedWrapper>
        )}

        {/* Widget de Movimientos Recientes */}
        {recentMovements.length > 0 && (
          <AnimatedWrapper delay={1.0}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Movimientos Recientes</CardTitle>
                    <CardDescription>Últimos movimientos de stock registrados</CardDescription>
                  </div>
                  <Button as={Link} to={ROUTES.MOVEMENTS} variant="outline" size="sm">
                    Ver Todos
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {recentMovements.slice(0, 10).map((movement) => {
                    const lot = movement.lot as any;
                    const product = lot?.product;
                    return (
                      <div
                        key={movement.movement_id}
                        className="p-3 border rounded-lg hover:bg-muted dark:hover:bg-dark-muted transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-sm">
                              {product?.product_name || 'Producto desconocido'} - Lote #{movement.lot_id}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {movement.movement_type?.type_name || 'N/A'} -{' '}
                              {new Date(movement.created_at).toLocaleString('es-MX')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`font-semibold text-sm ${
                                movement.movement_type?.category === 'ENTRADA'
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-red-600 dark:text-red-400'
                              }`}
                            >
                              {movement.movement_type?.category === 'ENTRADA' ? '+' : '-'}
                              {movement.quantity.toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Stock: {lot?.current_quantity?.toFixed(2) || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {recentMovements.length > 10 && (
                  <div className="mt-4 text-center">
                    <Button as={Link} to={ROUTES.MOVEMENTS} variant="outline" size="sm">
                      Ver {recentMovements.length - 10} más...
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </AnimatedWrapper>
        )}
      </div>
    </AnimatedWrapper>
  );
};

const NutritionistDashboard: React.FC = () => {
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


  if (loading) {
    return <LoadingSpinner size="lg" message="Cargando tablero..." centerScreen />;
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
  const { loading } = useAuth();
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
