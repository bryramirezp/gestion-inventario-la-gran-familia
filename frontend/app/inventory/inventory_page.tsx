'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthContext } from '@/hooks/AuthProvider';
import { inventory, products, warehouses } from '@/lib/data';
import { Package, AlertTriangle, Clock, TrendingUp } from 'lucide-react';

export default function Inventory() {
  const { user, loading } = useAuthContext();

  // Calculate inventory metrics
  const totalItems = inventory.length;
  const lowStockItems = inventory.filter(item => item.quantity <= item.minStock).length;
  const expiringItems = inventory.filter(item => 
    item.expirationDate && 
    new Date(item.expirationDate).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000
  ).length;

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || 'Producto no encontrado';
  };

  const getWarehouseName = (warehouseId: string) => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse?.name || 'Almacén no encontrado';
  };

  const getExpirationStatus = (expirationDate?: Date) => {
    if (!expirationDate) return { status: 'no-date', color: 'bg-gray-100', text: 'Sin fecha' };
    
    const now = new Date();
    const expDate = new Date(expirationDate);
    const daysUntilExpiry = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { status: 'expired', color: 'bg-red-100', text: 'Vencido' };
    if (daysUntilExpiry <= 7) return { status: 'urgent', color: 'bg-red-50', text: `${daysUntilExpiry} días` };
    if (daysUntilExpiry <= 30) return { status: 'warning', color: 'bg-yellow-50', text: `${daysUntilExpiry} días` };
    return { status: 'good', color: 'bg-green-50', text: `${daysUntilExpiry} días` };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventario de Alimentos</h1>
            <p className="text-gray-600 mt-1">Control y gestión del inventario de productos alimentarios</p>
          </div>
          <Button className="bg-gradient-to-r from-foundation-orange to-foundation-gold hover:from-foundation-orange/90 hover:to-foundation-gold/90">
            <Package className="w-4 h-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Productos</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{totalItems}</p>
                </div>
                <div className="p-3 rounded-full bg-foundation-orange/10">
                  <Package className="h-6 w-6 text-foundation-orange" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{lowStockItems}</p>
                </div>
                <div className="p-3 rounded-full bg-red-50">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Próximos a Vencer</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">{expiringItems}</p>
                </div>
                <div className="p-3 rounded-full bg-yellow-50">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-foundation-orange" />
              Inventario Actual
            </CardTitle>
            <CardDescription>
              Lista de todos los productos en inventario con sus cantidades y fechas de vencimiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inventory.map((item) => {
                const productName = getProductName(item.productId);
                const warehouseName = getWarehouseName(item.warehouseId);
                const expirationStatus = getExpirationStatus(item.expirationDate);
                const isLowStock = item.quantity <= item.minStock;

                return (
                  <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{productName}</h3>
                          <p className="text-sm text-gray-500">{warehouseName}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-gray-900">{item.quantity}</p>
                          <p className="text-xs text-gray-500">unidades</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900">Min: {item.minStock}</p>
                          <p className="text-sm font-medium text-gray-900">Max: {item.maxStock}</p>
                        </div>
                        <div className="text-center">
                          <Badge className={`${expirationStatus.color} text-gray-700`}>
                            {expirationStatus.text}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isLowStock && (
                        <Badge variant="destructive" className="text-xs">
                          Stock Bajo
                        </Badge>
                      )}
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
