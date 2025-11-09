import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  CubeIcon,
  ArchiveBoxIcon,
  TagIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  ChartPieIcon,
  UsersIcon,
  LogoutIcon,
  DollarSignIcon,
  ExclamationTriangleIcon,
  TrendingUpIcon,
  DatabaseBackupIcon,
} from '@/presentation/components/icons/Icons';
import { useAuth } from '@/app/providers/AuthProvider';
import { useUserProfile } from '@/infrastructure/hooks/useUserProfile';
import { Button } from '@/presentation/components/ui/Button';
import { ResponsiveImage } from '@/presentation/components/ui/ResponsiveImage';
import LoadingSpinner from '@/presentation/components/ui/LoadingSpinner';
import { ROUTES, ROLES, ROLE_PERMISSIONS } from '@/shared/constants';

const Sidebar: React.FC<{
  isCollapsed: boolean;
  isMobileOpen: boolean;
  setMobileOpen: (isOpen: boolean) => void;
  onToggleCollapse?: (collapsed: boolean) => void;
}> = ({ isCollapsed, isMobileOpen, setMobileOpen, onToggleCollapse }) => {
  const { user, logout } = useAuth();
  const { data: userProfile, isLoading: isProfileLoading } = useUserProfile();

  // Sidebar is now static (always expanded)

  const navigationSections = [
    {
      title: 'Principal',
      items: [
        {
          name: 'Tablero',
          href: ROUTES.DASHBOARD,
          icon: ChartPieIcon,
          roles: [ROLES.ADMINISTRADOR, ROLES.OPERADOR, ROLES.CONSULTOR],
        },
      ],
    },
    {
      title: 'Inventario y Donaciones',
      items: [
        {
          name: 'Productos',
          href: ROUTES.PRODUCTS,
          icon: CubeIcon,
          roles: ROLE_PERMISSIONS.INVENTORY_ACCESS,
        },
        {
          name: 'Donaciones',
          href: ROUTES.DONATIONS,
          icon: DollarSignIcon,
          roles: ROLE_PERMISSIONS.INVENTORY_ACCESS,
        },
        {
          name: 'Almacenes',
          href: ROUTES.WAREHOUSES,
          icon: BuildingStorefrontIcon,
          roles: ROLE_PERMISSIONS.INVENTORY_ACCESS,
        },
      ],
    },
    {
      title: 'Administración',
      items: [
        { name: 'Categorías', href: ROUTES.CATEGORIES, icon: ArchiveBoxIcon, roles: ROLE_PERMISSIONS.ADMIN_ACCESS },
        { name: 'Marcas', href: ROUTES.BRANDS, icon: TagIcon, roles: ROLE_PERMISSIONS.ADMIN_ACCESS },
        { name: 'Usuarios', href: ROUTES.USERS, icon: UsersIcon, roles: ROLE_PERMISSIONS.ADMIN_ACCESS },
        {
          name: 'Donantes',
          href: ROUTES.DONORS,
          icon: UserGroupIcon,
          roles: ROLE_PERMISSIONS.ADMIN_ACCESS,
        },
        {
          name: 'Respaldo y Reseteo',
          href: ROUTES.BACKUP,
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
          href: ROUTES.EXPIRY_REPORT,
          icon: ExclamationTriangleIcon,
          roles: ROLE_PERMISSIONS.INVENTORY_ACCESS,
        },
        {
          name: 'Análisis de Donantes',
          href: ROUTES.DONOR_ANALYSIS,
          icon: TrendingUpIcon,
          roles: ROLE_PERMISSIONS.INVENTORY_ACCESS,
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
      <div className="flex-shrink-0 pb-4 border-b border-border dark:border-dark-border">
        <div className="flex items-center justify-start">
            <div className={`flex items-center overflow-hidden transition-all duration-500 ease-in-out ${isCollapsed ? 'w-auto' : 'w-auto'}`}>
              <div className="bg-primary p-2 rounded-lg flex-shrink-0">
                <ResponsiveImage
                  src="/logo-lagranfamilia.png"
                  alt="La Gran Familia"
                  className="w-6 h-6 object-contain"
                  loading="eager"
                  width={24}
                  height={24}
                  sizes="24px"
                />
              </div>
            <h1 className={`text-xl font-bold ml-3 text-foreground dark:text-dark-foreground whitespace-nowrap transition-all duration-500 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
              La Gran Familia
            </h1>
          </div>
        </div>
      </div>

      {/* Navigation Section - Scrollable */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 py-4 transition-all duration-500 ease-in-out">
        <div className="space-y-2">
          {navigationSections.map((section) => {
            const availableItems = section.items.filter((item) => {
              if (!userProfile) return false; // Ensure userProfile is loaded
              if (item.adminOnly) {
                return userProfile.role_name === ROLES.ADMINISTRADOR;
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
                <h3 className={`px-3 text-xs font-semibold uppercase text-muted-foreground/80 tracking-wider mb-1 mt-3 transition-all duration-500 ease-in-out ${isCollapsed ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
                  <span>{section.title}</span>
                </h3>
                {availableItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `${linkClasses} ${isActive ? activeLinkClasses : ''} group relative transition-all duration-300 ease-in-out transform-gpu ${isCollapsed ? 'justify-center px-2' : ''}`
                    }
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className={`ml-3 whitespace-nowrap transition-all duration-500 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
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
      <div className="flex-shrink-0 border-t border-border dark:border-dark-border pt-4 mt-4">
        {user && (
          <div>
            <Button
              variant="ghost"
              className={`w-full transition-all duration-300 ease-in-out hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 ${isCollapsed ? 'justify-center px-2' : ''}`}
              onClick={logout}
            >
              <LogoutIcon className="w-5 h-5 flex-shrink-0" />
              <span className={`ml-2 whitespace-nowrap transition-all duration-500 ease-in-out ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
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
            flex flex-col flex-shrink-0
            transition-transform duration-500 ease-in-out
            fixed top-0 left-0 z-50
            h-screen
            w-64
            ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
            ${!isCollapsed ? 'lg:translate-x-0' : 'lg:-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full p-4">
          {sidebarContent}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
