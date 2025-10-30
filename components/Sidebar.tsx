import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  CubeIcon,
  ArchiveBoxIcon,
  TagIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  ChartPieIcon,
  ChefHatIcon,
  UsersIcon,
  LogoutIcon,
  DollarSignIcon,
  ExclamationTriangleIcon,
  TrendingUpIcon,
  DatabaseBackupIcon,
} from './icons/Icons';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../hooks/useUserProfile';
import { Button } from './Button';
import LoadingSpinner from './LoadingSpinner';

const Sidebar: React.FC<{
  isCollapsed: boolean;
  isMobileOpen: boolean;
  setMobileOpen: (isOpen: boolean) => void;
  onToggleCollapse?: (collapsed: boolean) => void;
}> = ({ isCollapsed, isMobileOpen, setMobileOpen, onToggleCollapse }) => {
  const { user, logout } = useAuth();
  const { data: userProfile, isLoading: isProfileLoading } = useUserProfile();

  // Sidebar is now static (always expanded)
  const persistentCollapsed = false;

  const navigationSections = [
    {
      title: 'Principal',
      items: [
        {
          name: 'Tablero',
          href: '/dashboard',
          icon: ChartPieIcon,
          roles: ['Administrador', 'Operador', 'Consultor'],
        },
      ],
    },
    {
      title: 'Inventario y Donaciones',
      items: [
        {
          name: 'Productos',
          href: '/products',
          icon: CubeIcon,
          roles: ['Administrador', 'Operador'],
        },
        {
          name: 'Donaciones',
          href: '/donations',
          icon: DollarSignIcon,
          roles: ['Administrador', 'Operador'],
        },
        {
          name: 'Donantes',
          href: '/donors',
          icon: UserGroupIcon,
          roles: ['Administrador', 'Operador'],
        },
        {
          name: 'Almacenes',
          href: '/warehouses',
          icon: BuildingStorefrontIcon,
          roles: ['Administrador', 'Operador'],
        },
      ],
    },
    {
      title: 'Administración',
      items: [
        {
          name: 'Cocina',
          href: '/kitchen',
          icon: ChefHatIcon,
          roles: ['Administrador', 'Operador', 'Consultor'],
        },
        { name: 'Categorías', href: '/categories', icon: ArchiveBoxIcon, roles: ['Administrador'] },
        { name: 'Marcas', href: '/brands', icon: TagIcon, roles: ['Administrador'] },
        { name: 'Usuarios', href: '/users', icon: UsersIcon, roles: ['Administrador'] },
        {
          name: 'Respaldo y Reseteo',
          href: '/backup',
          icon: DatabaseBackupIcon,
          roles: [],
          adminOnly: true,
        },
      ],
    },
    {
      title: 'Reportes',
      items: [
        {
          name: 'Reporte de Caducidad',
          href: '/expiry-report',
          icon: ExclamationTriangleIcon,
          roles: ['Administrador', 'Operador'],
        },
        {
          name: 'Análisis de Donantes',
          href: '/donor-analysis',
          icon: TrendingUpIcon,
          roles: ['Administrador', 'Operador'],
        },
      ],
    },
  ];

  const linkClasses =
    'flex items-center px-3 py-2 text-muted-foreground dark:text-dark-muted-foreground rounded-md text-sm font-medium hover:bg-accent dark:hover:bg-dark-accent hover:text-accent-foreground dark:hover:text-dark-accent-foreground transition-all duration-200 hover:translate-x-1';
  const activeLinkClasses =
    'bg-primary text-primary-foreground dark:bg-primary dark:text-dark-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-sm';

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header Section - Fixed */}
      <div className="flex-shrink-0">
        <div className="flex items-center mb-6 px-2 justify-start">
          <div className="flex items-center overflow-hidden transition-all duration-500 ease-in-out w-auto">
            <div className="bg-primary p-2 rounded-lg flex-shrink-0">
              <img src="/logo-lagranfamilia.png" alt="La Gran Familia" className="w-6 h-6 object-contain" />
            </div>
            <h1 className="text-xl font-bold ml-3 text-foreground dark:text-dark-foreground whitespace-nowrap">
              La Gran Familia
            </h1>
          </div>
        </div>
      </div>

      {/* Navigation Section - Scrollable */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden -mr-2 pr-2 transition-all duration-500 ease-in-out">
        <div className="space-y-2">
          {navigationSections.map((section) => {
            const availableItems = section.items.filter((item) => {
              if (!userProfile) return false; // Ensure userProfile is loaded
              if (item.adminOnly) {
                return userProfile.role_name === 'Administrador';
              }
              return item.roles.includes(userProfile.role_name);
            });
            if (availableItems.length === 0) return null;

            if (isProfileLoading) {
              return (
                <div key={section.title} className="flex justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              );
            }

            return (
              <div key={section.title}>
                <h3 className="px-3 text-xs font-semibold uppercase text-muted-foreground/80 tracking-wider mb-1 mt-3 transition-all duration-500 ease-in-out">
                  <span>{section.title}</span>
                </h3>
                {availableItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `${linkClasses} ${isActive ? activeLinkClasses : ''} group relative transition-all duration-300 ease-in-out transform-gpu`
                    }
                    onMouseEnter={() => {
                      // Prefetch route on hover for better UX
                      import(`../pages/${item.name.replace(/\s+/g, '')}.tsx`).catch(() => {
                        // Ignore prefetch errors
                      });
                    }}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="ml-3 whitespace-nowrap transition-all duration-500 ease-in-out">
                      {item.name}
                    </span>
                  </NavLink>
                ))}
              </div>
            );
          })}
        </div>
      </nav>
      {/* Footer Section - Fixed */}
      <div className="flex-shrink-0">
        {user && (
          <div className="border-t border-border dark:border-dark-border pt-4">
            <Button
              variant="ghost"
              className="w-full transition-all duration-300 ease-in-out"
              onClick={logout}
            >
              <LogoutIcon className="w-5 h-5" />
              <span className="ml-2 whitespace-nowrap transition-all duration-500 ease-in-out">
                Cerrar Sesión
              </span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity lg:hidden ${isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Unified Sidebar */}
      <aside
        className="
            bg-card dark:bg-dark-card border-r border-border dark:border-dark-border
            flex flex-col flex-shrink-0 p-4
            transition-all duration-500 ease-in-out
            fixed lg:relative inset-y-0 left-0 z-50
            w-64
            lg:w-64
            translate-x-0
            lg:translate-x-0
        "
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
