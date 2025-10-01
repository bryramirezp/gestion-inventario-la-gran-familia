'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuthContext } from '@/hooks/AuthProvider';
import { TrendingUp, BarChart3, PieChart, FileText } from 'lucide-react';

export default function Reports() {
  const { user, loading } = useAuthContext();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reportes y Análisis</h1>
            <p className="text-gray-600 mt-1">Análisis detallado del rendimiento del sistema</p>
          </div>
          <Button className="bg-gradient-to-r from-foundation-orange to-foundation-gold hover:from-foundation-orange/90 hover:to-foundation-gold/90">
            <FileText className="w-4 h-4 mr-2" />
            Generar Reporte
          </Button>
        </div>

        {/* Report Types */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Consumo de Alimentos</p>
                  <p className="text-xs text-gray-500 mt-1">Análisis de consumo diario</p>
                </div>
                <div className="p-3 rounded-full bg-blue-50">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Eficiencia de Almacén</p>
                  <p className="text-xs text-gray-500 mt-1">Rotación de inventario</p>
                </div>
                <div className="p-3 rounded-full bg-green-50">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Donaciones por Período</p>
                  <p className="text-xs text-gray-500 mt-1">Tendencias de donativos</p>
                </div>
                <div className="p-3 rounded-full bg-purple-50">
                  <PieChart className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Reporte Fiscal</p>
                  <p className="text-xs text-gray-500 mt-1">Valoración de donaciones</p>
                </div>
                <div className="p-3 rounded-full bg-orange-50">
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon */}
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-16 w-16 text-foundation-orange mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Módulo de Reportes en Desarrollo
            </h3>
            <p className="text-gray-600 mb-6">
              Esta sección incluirá reportes detallados y análisis avanzados para ayudar en la toma de decisiones,
              incluyendo gráficos interactivos, exportación de datos y reportes personalizados.
            </p>
            <div className="flex justify-center space-x-4">
              <Button variant="outline">
                Ver Reportes Básicos
              </Button>
              <Button className="bg-gradient-to-r from-foundation-orange to-foundation-gold hover:from-foundation-orange/90 hover:to-foundation-gold/90">
                Configurar Reporte
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
