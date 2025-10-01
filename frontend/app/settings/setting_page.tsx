'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Settings as SettingsIcon, Shield, Database, Bell, Palette } from 'lucide-react';
import { useState, useEffect } from 'react';

// Simulamos usuario autenticado
const mockUser = { name: 'Admin Demo', role: 'admin' };

export default function Settings() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    setUser(mockUser);
  }, []);

  if (!user) return <p>Cargando...</p>;

  // Solo admin puede acceder
  if (user.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card>
            <CardContent className="p-12 text-center">
              <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Acceso Restringido
              </h3>
              <p className="text-gray-600">
                Solo los administradores pueden acceder a esta sección.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
            <p className="text-gray-600 mt-1">Configuración avanzada y personalización</p>
          </div>
          <Button className="bg-gradient-to-r from-foundation-orange to-foundation-gold hover:from-foundation-orange/90 hover:to-foundation-gold/90">
            <SettingsIcon className="w-4 h-4 mr-2" />
            Guardar Cambios
          </Button>
        </div>

        {/* Settings Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Configuración General</p>
                <p className="text-xs text-gray-500 mt-1">Configuración básica del sistema</p>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <SettingsIcon className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Base de Datos</p>
                <p className="text-xs text-gray-500 mt-1">Gestión de datos y respaldos</p>
              </div>
              <div className="p-3 rounded-full bg-green-50">
                <Database className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Notificaciones</p>
                <p className="text-xs text-gray-500 mt-1">Alertas y recordatorios</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-50">
                <Bell className="h-6 w-6 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Apariencia</p>
                <p className="text-xs text-gray-500 mt-1">Personalización visual</p>
              </div>
              <div className="p-3 rounded-full bg-purple-50">
                <Palette className="h-6 w-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon */}
        <Card>
          <CardContent className="p-12 text-center">
            <SettingsIcon className="h-16 w-16 text-foundation-orange mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Módulo de Configuración en Desarrollo
            </h3>
            <p className="text-gray-600 mb-6">
              Esta sección incluirá todas las opciones de configuración del sistema,
              incluyendo personalización de la interfaz, configuración de alertas,
              gestión de usuarios avanzada y opciones de integración.
            </p>
            <div className="flex justify-center space-x-4">
              <Button variant="outline">Ver Configuración Actual</Button>
              <Button className="bg-gradient-to-r from-foundation-orange to-foundation-gold hover:from-foundation-orange/90 hover:to-foundation-gold/90">
                Configurar Sistema
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
