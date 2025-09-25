'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { movements, products, warehouses } from '@/lib/data';
import { MoveHorizontal, Plus, Package, ArrowUpRight, ArrowDownLeft, ArrowRightLeft } from 'lucide-react';

export default function Movements() {
  const { user } = useAuth();

  // Calculate movement metrics
  const totalMovements = movements.length;
  const entryMovements = movements.filter(m => m.type === 'entry').length;
  const exitMovements = movements.filter(m => m.type === 'exit').length;
  const transferMovements = movements.filter(m => m.type === 'transfer').length;

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || 'Producto no encontrado';
  };

  const getWarehouseName = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse?.name || 'Almacén no encontrado';
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'entry':
        return <ArrowUpRight className="h-4 w-4 text-green-600" />;
      case 'exit':
        return <ArrowDownLeft className="h-4 w-4 text-red-600" />;
      case 'transfer':
        return <ArrowRightLeft className="h-4 w-4 text-blue-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'entry':
        return 'bg-green-100 text-green-800';
      case 'exit':
        return 'bg-red-100 text-red-800';
      case 'transfer':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMovementLabel = (type: string) => {
    switch (type) {
      case 'entry':
        return 'Entrada';
      case 'exit':
        return 'Salida';
      case 'transfer':
        return 'Transferencia';
      default:
        return 'Movimiento';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Movimientos de Inventario</h1>
            <p className="text-gray-600 mt-1">Registro de entradas, salidas y transferencias de productos</p>
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

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Movimientos</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{totalMovements}</p>
                </div>
                <div className="p-3 rounded-full bg-foundation-orange/10">
                  <MoveHorizontal className="h-6 w-6 text-foundation-orange" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Entradas</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{entryMovements}</p>
                </div>
                <div className="p-3 rounded-full bg-green-50">
                  <ArrowUpRight className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Salidas</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{exitMovements}</p>
                </div>
                <div className="p-3 rounded-full bg-red-50">
                  <ArrowDownLeft className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Transferencias</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{transferMovements}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-50">
                  <ArrowRightLeft className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
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
              {movements.map((movement) => {
                const productName = getProductName(movement.productId);
                const fromWarehouse = movement.fromWarehouseId ? getWarehouseName(movement.fromWarehouseId) : null;
                const toWarehouse = movement.toWarehouseId ? getWarehouseName(movement.toWarehouseId) : null;

                return (
                  <div key={movement.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
                          {getMovementIcon(movement.type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{productName}</h3>
                          <p className="text-sm text-gray-500">{movement.reason}</p>
                          {movement.type === 'transfer' && fromWarehouse && toWarehouse && (
                            <p className="text-xs text-gray-400">
                              {fromWarehouse} → {toWarehouse}
                            </p>
                          )}
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-gray-900">{movement.quantity}</p>
                          <p className="text-xs text-gray-500">unidades</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">
                            {new Date(movement.date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(movement.date).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="text-center">
                          <Badge className={getMovementColor(movement.type)}>
                            {getMovementLabel(movement.type)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
