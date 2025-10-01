'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthContext } from '@/hooks/AuthProvider';
import { warehouses, inventory } from '@/lib/data';
import { Warehouse, Plus, Package, Users, Calendar, MapPin } from 'lucide-react';

export default function Warehouses() {
  const { user, loading } = useAuthContext();

  // Calculate warehouse metrics
  const totalWarehouses = warehouses.length;
  const totalProducts = inventory.length;

  const getWarehouseStats = (warehouseId: string) => {
    const warehouseInventory = inventory.filter(item => item.warehouseId === warehouseId);
    const totalItems = warehouseInventory.length;
    const totalQuantity = warehouseInventory.reduce((sum, item) => sum + item.quantity, 0);
    const lowStockItems = warehouseInventory.filter(item => item.quantity <= item.minStock).length;
    
    return { totalItems, totalQuantity, lowStockItems };
  };

  const getWarehouseIcon = (type: string) => {
    switch (type) {
      case 'cocina':
        return <Package className="h-6 w-6 text-foundation-orange" />;
      case 'bazar':
        return <Package className="h-6 w-6 text-foundation-gold" />;
      case 'almacen_general':
        return <Package className="h-6 w-6 text-foundation-bronze" />;
      default:
        return <Warehouse className="h-6 w-6 text-gray-600" />;
    }
  };

  const getWarehouseColor = (type: string) => {
    switch (type) {
      case 'cocina':
        return 'bg-foundation-orange/10 border-foundation-orange/20';
      case 'bazar':
        return 'bg-foundation-gold/10 border-foundation-gold/20';
      case 'almacen_general':
        return 'bg-foundation-bronze/10 border-foundation-bronze/20';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Almacenes</h1>
            <p className="text-gray-600 mt-1">Administración y control de los almacenes de la fundación</p>
          </div>
          <Button className="bg-gradient-to-r from-foundation-orange to-foundation-gold hover:from-foundation-orange/90 hover:to-foundation-gold/90">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Almacén
          </Button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Almacenes</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{totalWarehouses}</p>
                </div>
                <div className="p-3 rounded-full bg-foundation-orange/10">
                  <Warehouse className="h-6 w-6 text-foundation-orange" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Productos</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{totalProducts}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-50">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Almacenes Activos</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{totalWarehouses}</p>
                </div>
                <div className="p-3 rounded-full bg-green-50">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Warehouses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {warehouses.map((warehouse) => {
            const stats = getWarehouseStats(warehouse.id);
            
            return (
              <Card key={warehouse.id} className={`hover:shadow-lg transition-shadow duration-200 ${getWarehouseColor(warehouse.type)}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-white/50">
                        {getWarehouseIcon(warehouse.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {warehouse.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Activo
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-lg font-semibold text-gray-900">{stats.totalItems}</p>
                        <p className="text-xs text-gray-500">Productos</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-gray-900">{stats.totalQuantity}</p>
                        <p className="text-xs text-gray-500">Unidades</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-red-600">{stats.lowStockItems}</p>
                        <p className="text-xs text-gray-500">Stock Bajo</p>
                      </div>
                    </div>

                    {/* Warehouse Info */}
                    <div className="space-y-2 pt-3 border-t border-gray-200">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        Creado: {new Date(warehouse.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        Tipo: {warehouse.type.replace('_', ' ')}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          Ver Inventario
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          Configurar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Warehouse Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Warehouse className="h-5 w-5 mr-2 text-foundation-orange" />
              Resumen de Almacenes
            </CardTitle>
            <CardDescription>
              Estado general de todos los almacenes de la fundación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {warehouses.map((warehouse) => {
                const stats = getWarehouseStats(warehouse.id);
                
                return (
                  <div key={warehouse.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-white">
                        {getWarehouseIcon(warehouse.type)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{warehouse.name}</h3>
                        <p className="text-sm text-gray-500">{warehouse.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">{stats.totalItems}</p>
                        <p className="text-xs text-gray-500">Productos</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">{stats.totalQuantity}</p>
                        <p className="text-xs text-gray-500">Unidades</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-red-600">{stats.lowStockItems}</p>
                        <p className="text-xs text-gray-500">Stock Bajo</p>
                      </div>
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
