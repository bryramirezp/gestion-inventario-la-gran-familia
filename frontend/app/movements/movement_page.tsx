'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthContext } from '@/hooks/AuthProvider';
import { useMovements } from '@/hooks/useMovements';
import { MoveHorizontal, Plus, Package, ArrowUpRight, ArrowDownLeft, ArrowRightLeft } from 'lucide-react';

export default function Movements() {
  const { user, loading: authLoading } = useAuthContext();
  const { movements, loading, error } = useMovements();

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <p className="p-6 text-gray-500">Cargando movimientos...</p>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <p className="p-6 text-red-500">Error: {error}</p>
      </DashboardLayout>
    );
  }

  // 📊 Métricas
  const totalMovements = movements.length;
  const entryMovements = movements.filter(m => m.type === 'entrada').length;
  const exitMovements = movements.filter(m => m.type === 'salida').length;
  const transferMovements = movements.filter(m => m.type === 'transfer').length;

  // 🎨 Helpers UI
  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'entrada': return <ArrowUpRight className="h-4 w-4 text-green-600" />;
      case 'salida': return <ArrowDownLeft className="h-4 w-4 text-red-600" />;
      case 'transfer': return <ArrowRightLeft className="h-4 w-4 text-blue-600" />;
      default: return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'entrada': return 'bg-green-100 text-green-800';
      case 'salida': return 'bg-red-100 text-red-800';
      case 'transfer': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMovementLabel = (type: string) => {
    switch (type) {
      case 'entrada': return 'Entrada';
      case 'salida': return 'Salida';
      case 'transfer': return 'Transferencia';
      default: return 'Movimiento';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Movimientos de Inventario</h1>
            <p className="text-gray-600 mt-1">
              Registro de entradas, salidas y transferencias de productos
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Nueva Entrada
            </Button>
            <Button className="bg-gradient-to-r from-foundation-orange to-foundation-gold hover:from-foundation-orange/90 hover:to-foundation-gold/90">
              <Plus className="w-4 h-4 mr-2" />
              Registrar Movimiento
            </Button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card><CardContent className="p-6">
            <p className="text-sm font-medium text-gray-600">Total Movimientos</p>
            <p className="text-2xl font-bold text-gray-900">{totalMovements}</p>
          </CardContent></Card>

          <Card><CardContent className="p-6">
            <p className="text-sm font-medium text-gray-600">Entradas</p>
            <p className="text-2xl font-bold text-green-600">{entryMovements}</p>
          </CardContent></Card>

          <Card><CardContent className="p-6">
            <p className="text-sm font-medium text-gray-600">Salidas</p>
            <p className="text-2xl font-bold text-red-600">{exitMovements}</p>
          </CardContent></Card>

          <Card><CardContent className="p-6">
            <p className="text-sm font-medium text-gray-600">Transferencias</p>
            <p className="text-2xl font-bold text-blue-600">{transferMovements}</p>
          </CardContent></Card>
        </div>

        {/* Movements Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MoveHorizontal className="h-5 w-5 mr-2 text-foundation-orange" />
              Historial de Movimientos
            </CardTitle>
            <CardDescription>
              Registro completo de todos los movimientos de inventario realizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {movements.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100">
                      {getMovementIcon(m.type)}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{m.productName ?? `Producto #${m.productId}`}</h3>
                      {m.reason && <p className="text-sm text-gray-500">{m.reason}</p>}
                      {m.type === 'transfer' && m.fromWarehouseName && m.toWarehouseName && (
                        <p className="text-xs text-gray-400">{m.fromWarehouseName} → {m.toWarehouseName}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">{m.quantity}</p>
                    <p className="text-xs text-gray-500">unidades</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">{new Date(m.date).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-400">{new Date(m.date).toLocaleTimeString()}</p>
                  </div>
                  <Badge className={getMovementColor(m.type)}>{getMovementLabel(m.type)}</Badge>
                  <Button variant="outline" size="sm">Ver Detalles</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
