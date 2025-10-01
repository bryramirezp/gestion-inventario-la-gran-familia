'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthContext } from '@/hooks/AuthProvider';
import { ChefHat, Package, AlertTriangle, Clock } from 'lucide-react';

export default function Kitchen() {
  const { user, loading } = useAuthContext();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Cocina Comunitaria</h1>
            <p className="text-gray-600 mt-1">Gestión específica del almacén de cocina</p>
          </div>
          <Button className="bg-gradient-to-r from-foundation-orange to-foundation-gold hover:from-foundation-orange/90 hover:to-foundation-gold/90">
            <ChefHat className="w-4 h-4 mr-2" />
            Nuevo Movimiento
          </Button>
        </div>

        {/* Kitchen Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Productos en Cocina</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">15</p>
                </div>
                <div className="p-3 rounded-full bg-foundation-orange/10">
                  <ChefHat className="h-6 w-6 text-foundation-orange" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Consumo Diario</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">8</p>
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
                  <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">3</p>
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
                  <p className="text-2xl font-bold text-yellow-600 mt-1">2</p>
                </div>
                <div className="p-3 rounded-full bg-yellow-50">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon */}
        <Card>
          <CardContent className="p-12 text-center">
            <ChefHat className="h-16 w-16 text-foundation-orange mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Módulo de Cocina en Desarrollo
            </h3>
            <p className="text-gray-600 mb-6">
              Esta sección incluirá funcionalidades específicas para la gestión de la cocina comunitaria,
              incluyendo planificación de menús, control de consumo diario y alertas especializadas.
            </p>
            <div className="flex justify-center space-x-4">
              <Button variant="outline">
                Ver Inventario Actual
              </Button>
              <Button className="bg-gradient-to-r from-foundation-orange to-foundation-gold hover:from-foundation-orange/90 hover:to-foundation-gold/90">
                Registrar Consumo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
