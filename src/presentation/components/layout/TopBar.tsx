import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { useUserProfile } from '@/infrastructure/hooks/useUserProfile';
import { Button } from '@/presentation/components/ui/Button';
import NotificationBell from '@/presentation/features/shared/NotificationBell';
import {
  LogoutIcon,
  UserCircleIcon,
  ChevronDownIcon,
  PanelLeftIcon,
  MenuIcon,
} from '@/presentation/components/icons/Icons';
import ThemeToggle from '@/presentation/features/shared/ThemeToggle';

interface TopBarProps {
  onMobileMenuClick: () => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (isCollapsed: boolean) => void;
  isMobileMenuOpen?: boolean;
}

const TopBar: React.FC<TopBarProps> = ({
  onMobileMenuClick,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  isMobileMenuOpen = false,
}) => {
  const { logout } = useAuth();
  const { data: userProfile, isLoading: isProfileLoading } = useUserProfile();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 bg-card/90 dark:bg-dark-card/90 backdrop-blur-sm border-b border-border dark:border-dark-border transition-all duration-300`}
    >
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 relative">
        {/* Left side: Mobile menu button & Desktop toggle */}
        <div className="flex items-center">
          {/* Mobile: Toggle mobile menu */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileMenuClick}
            className="lg:hidden h-8 w-8"
            aria-label={isMobileMenuOpen ? 'Cerrar Menú' : 'Abrir Menú'}
            title={isMobileMenuOpen ? 'Cerrar Menú' : 'Abrir Menú'}
          >
            <MenuIcon className="h-5 w-5" />
          </Button>
          {/* Desktop: Toggle sidebar visibility */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden lg:inline-flex h-8 w-8"
            aria-label={isSidebarCollapsed ? 'Mostrar Sidebar' : 'Ocultar Sidebar'}
            title={isSidebarCollapsed ? 'Mostrar Sidebar' : 'Ocultar Sidebar'}
          >
            {isSidebarCollapsed ? (
              <MenuIcon className="h-5 w-5" />
            ) : (
              <PanelLeftIcon className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Center: DEMO indicator */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <span className="text-xl font-black tracking-[0.5em] text-black dark:text-white select-none">
            DEMO
          </span>
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <NotificationBell />
          <div className="h-8 w-px bg-border dark:bg-dark-border" />

          {userProfile && !isProfileLoading ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-muted dark:hover:bg-dark-muted"
              >
                <div className="p-1.5 bg-muted dark:bg-dark-muted rounded-full">
                  <UserCircleIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-semibold text-foreground dark:text-dark-foreground">
                    {userProfile.full_name}
                  </span>
                  <span className="text-xs text-muted-foreground dark:text-dark-muted-foreground">
                    {userProfile.role_name}
                  </span>
                </div>
                <ChevronDownIcon
                  className={`w-4 h-4 text-muted-foreground transition-transform hidden sm:block ${isProfileOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-card rounded-md shadow-lg border border-border dark:border-dark-border z-10 animate-slide-up">
                  <div className="p-1">
                    <Link
                      to="/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center w-full px-3 py-2 text-sm text-foreground hover:bg-muted dark:hover:bg-dark-muted rounded-md"
                    >
                      <UserCircleIcon className="w-4 h-4 mr-2" />
                      Mi Perfil
                    </Link>
                    <button
                      onClick={logout}
                      className="flex items-center w-full px-3 py-2 text-sm text-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 rounded-md transition-colors"
                    >
                      <LogoutIcon className="w-4 h-4 mr-2" />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : isProfileLoading ? (
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-muted dark:bg-dark-muted rounded-full">
                <UserCircleIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-semibold text-foreground dark:text-dark-foreground">
                  Cargando...
                </span>
                <span className="text-xs text-muted-foreground dark:text-dark-muted-foreground">
                  Cargando rol...
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
