'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthContext } from '@/hooks/AuthProvider';
import { ShoppingCart, DollarSign, TrendingUp, Package } from 'lucide-react';

export default function Bazar() {
  const { user, loading } = useAuthContext();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bazar de la Fundación</h1>
            <p className="text-gray-600 mt-1">Punto de venta y distribución de productos</p>
          </div>
          <Button className="bg-gradient-to-r from-foundation-orange to-foundation-gold hover:from-foundation-orange/90 hover:to-foundation-gold/90">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Nueva Venta
          </Button>
        </div>

        {/* Bazar Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Productos en Venta</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">12</p>
                </div>
                <div className="p-3 rounded-full bg-foundation-gold/10">
                  <ShoppingCart className="h-6 w-6 text-foundation-gold" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ventas del Mes</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">$450</p>
                </div>
                <div className="p-3 rounded-full bg-green-50">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Transacciones</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">28</p>
                </div>
                <div className="p-3 rounded-full bg-blue-50">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Inventario Total</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">156</p>
                </div>
                <div className="p-3 rounded-full bg-purple-50">
                  <Package className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon */}
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingCart className="h-16 w-16 text-foundation-gold mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Módulo de Bazar en Desarrollo
            </h3>
            <p className="text-gray-600 mb-6">
              Esta sección incluirá funcionalidades específicas para el bazar de la fundación,
              incluyendo gestión de ventas, control de precios, reportes de ingresos y
              gestión de productos no aptos para los niños.
            </p>
            <div className="flex justify-center space-x-4">
              <Button variant="outline">
                Ver Inventario
              </Button>
              <Button className="bg-gradient-to-r from-foundation-orange to-foundation-gold hover:from-foundation-orange/90 hover:to-foundation-gold/90">
                Registrar Venta
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
