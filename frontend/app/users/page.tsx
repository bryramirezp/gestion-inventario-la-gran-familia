'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { Users, Plus, Shield, Mail, Calendar } from 'lucide-react';

export default function Users() {
  const { user } = useAuth();

  // Only super_admin can access this page
  if (user?.role !== 'super_admin') {
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

  // Mock users data
  const systemUsers = [
    {
      id: '1',
      name: 'Lorena',
      email: 'lorena@fundacion.org',
      role: 'super_admin',
      warehouses: [],
      createdAt: new Date('2024-01-01'),
      lastLogin: new Date('2024-01-20'),
      status: 'active'
    },
    {
      id: '2',
      name: 'Lilith',
      email: 'lilith@fundacion.org',
      role: 'super_admin',
      warehouses: [],
      createdAt: new Date('2024-01-01'),
      lastLogin: new Date('2024-01-19'),
      status: 'active'
    },
    {
      id: '3',
      name: 'Empleado Demo',
      email: 'empleado@fundacion.org',
      role: 'employee',
      warehouses: ['cocina', 'bazar'],
      createdAt: new Date('2024-01-15'),
      lastLogin: new Date('2024-01-18'),
      status: 'active'
    }
  ];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge className="bg-red-100 text-red-800">Super Admin</Badge>;
      case 'admin':
        return <Badge className="bg-blue-100 text-blue-800">Admin</Badge>;
      case 'employee':
        return <Badge className="bg-green-100 text-green-800">Empleado</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' 
      ? <Badge className="bg-green-100 text-green-800">Activo</Badge>
      : <Badge className="bg-gray-100 text-gray-800">Inactivo</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
            <p className="text-gray-600 mt-1">Administración de usuarios del sistema</p>
          </div>
          <Button className="bg-gradient-to-r from-foundation-orange to-foundation-gold hover:from-foundation-orange/90 hover:to-foundation-gold/90">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{systemUsers.length}</p>
                </div>
                <div className="p-3 rounded-full bg-foundation-orange/10">
                  <Users className="h-6 w-6 text-foundation-orange" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Administradores</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {systemUsers.filter(u => u.role === 'super_admin').length}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-red-50">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Empleados</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {systemUsers.filter(u => u.role === 'employee').length}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-50">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-foundation-orange" />
              Lista de Usuarios
            </CardTitle>
            <CardDescription>
              Gestión completa de usuarios del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemUsers.map((systemUser) => (
                <div key={systemUser.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-foundation-bronze rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {systemUser.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{systemUser.name}</h3>
                        <p className="text-sm text-gray-500">{systemUser.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          {getRoleBadge(systemUser.role)}
                          {getStatusBadge(systemUser.status)}
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          Último acceso
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(systemUser.lastLogin).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">
                          <Mail className="h-4 w-4 inline mr-1" />
                          Creado
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(systemUser.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      Desactivar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
