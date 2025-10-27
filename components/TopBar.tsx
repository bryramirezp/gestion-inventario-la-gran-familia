import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../hooks/useUserProfile'; // Ensure this import is present
import { Button } from './Button';
import NotificationBell from './NotificationBell';
import {
  LogoutIcon,
  UserCircleIcon,
  ChevronDownIcon,
  PanelLeftIcon,
} from './icons/Icons';
import ThemeToggle from './ThemeToggle';

interface TopBarProps {
  onMobileMenuClick: () => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (isCollapsed: boolean) => void;
}

const TopBar: React.FC<TopBarProps> = ({
  onMobileMenuClick: _onMobileMenuClick,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
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
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left side: Mobile menu button & new Desktop toggle */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden lg:inline-flex h-8 w-8"
            aria-label="Toggle Sidebar"
          >
            <PanelLeftIcon className="h-5 w-5" />
          </Button>
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
                      className="flex items-center w-full px-3 py-2 text-sm text-foreground hover:bg-muted dark:hover:bg-dark-muted rounded-md"
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
