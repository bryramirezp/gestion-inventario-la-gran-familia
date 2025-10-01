'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Package,
  Home,
  Warehouse,
  Users,
  TrendingUp,
  ShoppingCart,
  ChefHat,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Gift,
  MoveHorizontal,
} from 'lucide-react';
import { useAuthContext } from '@/hooks/AuthProvider'; // ✅ usamos el AuthProvider

// Menú principal
const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Almacenes', href: '/warehouses', icon: Warehouse },
  { name: 'Productos', href: '/products', icon: Package },
  { name: 'Inventario', href: '/inventory', icon: Package },
  { name: 'Cocina', href: '/kitchen', icon: ChefHat },
  { name: 'Bazar', href: '/bazar', icon: ShoppingCart },
  { name: 'Donaciones', href: '/donations', icon: Gift },
  { name: 'Movimientos', href: '/movements', icon: MoveHorizontal },
  { name: 'Reportes', href: '/reports', icon: TrendingUp },
  { name: 'KPIs', href: '/kpis', icon: FileText },
];

// Menú solo para admin
const adminOnlyItems = [
  { name: 'Usuarios', href: '/users', icon: Users },
  { name: 'Configuración', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const { user, loading } = useAuthContext(); // ✅ datos reales del usuario
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  if (loading) return <p className="p-4">Cargando usuario...</p>;

  // Determinar si el usuario es admin
  const adminEmails = ['lorena@fundacion.org', 'lilith@fundacion.org'];
  const isAdmin = user?.rol === 'admin' || adminEmails.includes(user?.email || '');
  const allItems = [...navigationItems, ...(isAdmin ? adminOnlyItems : [])];

  const logout = async () => {
    // Opcional: podrías llamar a la función logout del contexto
    window.location.href = '/login';
  };

  return (
    <>
      {/* Botón menú móvil */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center px-6 py-4 bg-gradient-to-r from-foundation-orange to-foundation-gold">
            <Package className="h-8 w-8 text-white" />
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-white">La Gran Familia</h1>
              <p className="text-foundation-cream text-sm">Sistema de Inventario</p>
            </div>
          </div>

          {/* Info usuario */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-foundation-bronze rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user?.nombre?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user?.nombre || 'Usuario'}</p>
                <p className="text-xs text-gray-500">
                  {isAdmin ? 'Administrador' : 'Empleado'}
                </p>
              </div>
            </div>
          </div>

          {/* Navegación */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {allItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200',
                    isActive
                      ? 'bg-foundation-orange text-white'
                      : 'text-gray-700 hover:bg-foundation-cream hover:text-foundation-brown'
                  )}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <item.icon
                    className={cn('mr-3 h-5 w-5', isActive ? 'text-white' : 'text-gray-400')}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:bg-red-50 hover:text-red-600"
              onClick={logout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay móvil */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}
