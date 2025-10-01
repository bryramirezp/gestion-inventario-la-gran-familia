'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  DollarSign,
  Users,
  ChefHat,
  ShoppingCart,
} from 'lucide-react';
import { useAuthContext } from '@/hooks/AuthProvider'; // ✅ traemos el contexto real
import { kpis, inventory, movements, donations } from '@/lib/data';

export default function Dashboard() {
  const { user, loading } = useAuthContext(); // ✅ usamos datos reales del usuario

  if (loading) return <p className="p-4">Cargando usuario...</p>;
  if (!user) return <p className="p-4">No hay usuario autenticado.</p>;

  // Métricas
  const totalProducts = inventory.length;
  const lowStockItems = inventory.filter(item => item.quantity <= item.minStock).length;
  const expiringItems = inventory.filter(item => 
    item.expirationDate && 
    new Date(item.expirationDate).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
  ).length;
  const totalDonationValue = donations.reduce((sum, donation) => sum + donation.totalValue, 0);
  const monthlyMovements = movements.filter(m => new Date(m.date).getMonth() === new Date().getMonth()).length;

  const dashboardCards = [
    { title: 'Total Productos', value: totalProducts, change: '+5%', icon: Package, color: 'text-foundation-orange', bgColor: 'bg-foundation-orange/10' },
    { title: 'Stock Bajo', value: lowStockItems, change: '-2%', icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-50' },
    { title: 'Próximos a Vencer', value: expiringItems, change: '+1', icon: TrendingDown, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    { title: 'Valor Donaciones', value: `$${totalDonationValue.toFixed(2)}`, change: '+15%', icon: DollarSign, color: 'text-green-600', bgColor: 'bg-green-50' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-foundation-orange to-foundation-gold rounded-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Bienvenid@, {user.nombre}</h1>
          <p className="text-foundation-cream">
            Panel de control del sistema de inventario de la fundación
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{card.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                      <div className="flex items-center mt-2">
                        <Badge variant="secondary" className="text-xs">{card.change}</Badge>
                      </div>
                    </div>
                    <div className={`p-3 rounded-full ${card.bgColor}`}>
                      <Icon className={`h-6 w-6 ${card.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* KPIs Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-foundation-orange" />
                KPIs Principales
              </CardTitle>
              <CardDescription>Indicadores clave de rendimiento del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {kpis.slice(0, 3).map(kpi => (
                <div key={kpi.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{kpi.name}</span>
                    <span className="text-sm text-gray-500">{kpi.value}/{kpi.target}</span>
                  </div>
                  <Progress value={(kpi.value / kpi.target) * 100} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumen de Almacenes</CardTitle>
              <CardDescription>Estado actual de los almacenes principales</CardDescription>
            </CardHeader>
            <CardContent>
              {[{name:'Cocina', icon:ChefHat},{name:'Bazar', icon:ShoppingCart},{name:'Almacén General', icon:Package}].map((store, idx) => {
                const Icon = store.icon;
                return (
                  <div key={idx} className="flex items-center justify-between p-3 bg-foundation-cream/30 rounded-lg">
                    <div className="flex items-center">
                      <Icon className="h-5 w-5 text-foundation-orange mr-3" />
                      <div>
                        <p className="font-medium">{store.name}</p>
                        <p className="text-sm text-gray-500">Almacén principal</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">Activo</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimos movimientos y cambios en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {movements.slice(0, 5).map(movement => (
                <div key={movement.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-b-0">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full mr-3 ${
                      movement.type === 'entry' ? 'bg-green-100' :
                      movement.type === 'exit' ? 'bg-red-100' : 'bg-blue-100'
                    }`}>
                      <Package className={`h-4 w-4 ${
                        movement.type === 'entry' ? 'text-green-600' :
                        movement.type === 'exit' ? 'text-red-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{movement.reason}</p>
                      <p className="text-xs text-gray-500">{new Date(movement.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {movement.type === 'entry' ? 'Entrada' : movement.type === 'exit' ? 'Salida' : 'Transferencia'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
