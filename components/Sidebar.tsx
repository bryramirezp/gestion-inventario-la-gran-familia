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

  // Persist collapsed state in localStorage
  const [persistentCollapsed, setPersistentCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // Sync with parent state and persist changes
  useEffect(() => {
    setPersistentCollapsed(isCollapsed);
  }, [isCollapsed]);

  const handleToggleCollapse = () => {
    const newCollapsed = !persistentCollapsed;
    setPersistentCollapsed(newCollapsed);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newCollapsed));
    onToggleCollapse?.(newCollapsed);
  };

  const navigationSections = [
    {
      title: 'Principal',
      items: [
        {
          name: 'Tablero',
          href: '/dashboard',
          icon: ChartPieIcon,
          roles: ['Administrator', 'Warehouse Manager', 'Kitchen Staff', 'Nutritionist'],
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
          roles: ['Administrator', 'Warehouse Manager'],
        },
        {
          name: 'Almacenes',
          href: '/warehouses',
          icon: BuildingStorefrontIcon,
          roles: ['Administrator', 'Warehouse Manager'],
        },
        {
          name: 'Donaciones',
          href: '/donations',
          icon: DollarSignIcon,
          roles: ['Administrator', 'Warehouse Manager'],
        },
        {
          name: 'Donantes',
          href: '/donors',
          icon: UserGroupIcon,
          roles: ['Administrator', 'Warehouse Manager'],
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
          roles: ['Administrator', 'Warehouse Manager', 'Kitchen Staff', 'Nutritionist'],
        },
        { name: 'Categorías', href: '/categories', icon: ArchiveBoxIcon, roles: ['Administrator'] },
        { name: 'Marcas', href: '/brands', icon: TagIcon, roles: ['Administrator'] },
        { name: 'Usuarios', href: '/users', icon: UsersIcon, roles: ['Administrator'] },
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
          roles: ['Administrator', 'Warehouse Manager'],
        },
        {
          name: 'Análisis de Donantes',
          href: '/donor-analysis',
          icon: TrendingUpIcon,
          roles: ['Administrator', 'Warehouse Manager'],
        },
      ],
    },
  ];

  const linkClasses =
    'flex items-center px-3 py-2 text-muted-foreground dark:text-dark-muted-foreground rounded-md text-sm font-medium hover:bg-accent dark:hover:bg-dark-accent hover:text-accent-foreground dark:hover:text-dark-accent-foreground transition-colors duration-200';
  const activeLinkClasses =
    'bg-primary text-primary-foreground dark:bg-primary dark:text-dark-primary-foreground hover:bg-primary/90 hover:text-primary-foreground';

  const sidebarContent = (
    <div className={`flex flex-col h-full ${persistentCollapsed ? 'lg:hidden' : ''}`}>
      {/* Header Section - Fixed */}
      <div className="flex-shrink-0">
        <div
          className={`flex items-center mb-6 px-2 ${persistentCollapsed ? 'justify-center' : 'justify-start'}`}
        >
          <div
            className={`flex items-center overflow-hidden transition-all duration-500 ease-in-out ${persistentCollapsed ? 'w-0' : 'w-auto'}`}
          >
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
      <nav className={`flex-1 overflow-y-auto overflow-x-hidden -mr-2 pr-2 transition-all duration-500 ease-in-out ${persistentCollapsed ? 'lg:hidden' : ''}`}>
        <div className="space-y-2">
          {navigationSections.map((section) => {
            const availableItems = section.items.filter((item) => {
              if (!userProfile) return false; // Ensure userProfile is loaded
              if (item.adminOnly) {
                return userProfile.role_name === 'Administrator';
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
                <h3
                  className={`px-3 text-xs font-semibold uppercase text-muted-foreground/80 tracking-wider mb-1 mt-3 transition-all duration-500 ease-in-out ${persistentCollapsed ? 'text-center' : ''}`}
                >
                  <span className={persistentCollapsed ? 'hidden lg:inline-block' : ''}>{section.title}</span>
                </h3>
                {availableItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `${linkClasses} ${isActive ? activeLinkClasses : ''} ${persistentCollapsed ? 'justify-center' : ''} group relative transition-all duration-300 ease-in-out`
                    }
                    onMouseEnter={() => {
                      // Prefetch route on hover for better UX
                      if (!persistentCollapsed) {
                        // Only prefetch when sidebar is expanded to avoid unnecessary loads
                        import(`../pages/${item.name.replace(/\s+/g, '')}.tsx`).catch(() => {
                          // Ignore prefetch errors
                        });
                      }
                    }}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span
                      className={`ml-3 whitespace-nowrap transition-all duration-500 ease-in-out ${persistentCollapsed ? 'lg:hidden' : ''}`}
                    >
                      {item.name}
                    </span>
                    <span
                      className={`
                                      absolute left-full ml-4 px-2 py-1 rounded-md text-sm z-20
                                      bg-card dark:bg-dark-card text-foreground dark:text-dark-foreground
                                      border border-border dark:border-dark-border shadow-md
                                      invisible group-hover:visible whitespace-nowrap
                                      transition-all duration-300 ease-in-out scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100
                                      ${!persistentCollapsed ? 'hidden' : ''}
                                  `}
                    >
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
      <div className={`flex-shrink-0 ${persistentCollapsed ? 'lg:hidden' : ''}`}>
        {user && (
          <div className="border-t border-border dark:border-dark-border pt-4">
            <Button
              variant="ghost"
              className={`w-full transition-all duration-300 ease-in-out ${persistentCollapsed ? 'justify-center' : ''}`}
              onClick={logout}
              title={persistentCollapsed ? 'Cerrar Sesión' : undefined}
            >
              <LogoutIcon className="w-5 h-5" />
              <span className={`ml-2 whitespace-nowrap transition-all duration-500 ease-in-out ${persistentCollapsed ? 'lg:hidden' : ''}`}>
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
        className={`
            bg-card dark:bg-dark-card border-r border-border dark:border-dark-border
            flex flex-col flex-shrink-0 p-4
            transition-all duration-500 ease-in-out
            fixed lg:relative inset-y-0 left-0 z-50
            w-64
            ${persistentCollapsed ? 'lg:w-0 lg:border-r-0 lg:p-0' : 'lg:w-64'}
            ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
