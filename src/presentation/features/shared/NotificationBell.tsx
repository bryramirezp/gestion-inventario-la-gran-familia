import React, { useState, useEffect, useRef } from 'react';
import { useNotifications } from '@/app/providers/NotificationProvider';
import { BellIcon, ExclamationTriangleIcon } from '@/presentation/components/icons/Icons';
import { Button } from '@/presentation/components/ui/Button';
import { Link } from 'react-router-dom';

const NotificationBell: React.FC = () => {
  const {
    lowStockNotifications,
    expiryNotifications,
    unreadCount,
    markAsRead,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLinkClick = (id: string) => {
    markAsRead(id);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
        aria-label={`Ver notificaciones. ${unreadCount} sin leer.`}
        aria-expanded={isOpen}
      >
        <BellIcon className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-4 w-4 rounded-full ring-2 ring-card dark:ring-dark-card bg-destructive text-white text-[10px] flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-2 sm:right-0 w-[calc(100vw-3rem)] max-w-sm sm:w-80 bg-card rounded-lg shadow-medium z-20 border border-border dark:border-dark-border animate-slide-up">
          <div className="p-2 sm:p-3 font-semibold border-b border-border text-foreground dark:text-dark-foreground text-sm sm:text-base">
            Notificaciones ({unreadCount})
          </div>
          <div className="max-h-[calc(100vh-12rem)] sm:max-h-96 overflow-y-auto">
            {unreadCount > 0 ? (
              <>
                {lowStockNotifications.length > 0 && (
                  <div>
                    <h4 className="p-2 sm:p-3 text-xs font-bold uppercase text-muted-foreground dark:text-dark-muted-foreground">
                      Alertas de Stock Bajo ({lowStockNotifications.length})
                    </h4>
                    <ul>
                      {lowStockNotifications.map((notif) => (
                        <li
                          key={`low-${notif.product_id}`}
                          className="border-b border-border dark:border-dark-border last:border-b-0"
                        >
                          <Link
                            to="/products"
                            onClick={() => handleLinkClick(`low-${notif.product_id}`)}
                            className="block p-2 sm:p-3 hover:bg-muted/50 dark:hover:bg-dark-muted/50 active:bg-muted dark:active:bg-dark-muted transition-colors"
                          >
                            <div className="flex items-start gap-2 sm:gap-3">
                              <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 text-warning flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-xs sm:text-sm text-foreground dark:text-dark-foreground break-words">
                                  {notif.product_name} tiene stock bajo.
                                </p>
                                <p className="text-xs text-muted-foreground dark:text-dark-muted-foreground mt-1 break-words">
                                  Actual:{' '}
                                  <span className="font-semibold text-destructive">
                                    {notif.total_stock}
                                  </span>{' '}
                                  / Límite:{' '}
                                  <span className="font-semibold">{notif.low_stock_threshold}</span>
                                </p>
                              </div>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {expiryNotifications.length > 0 && (
                  <div>
                    <h4 className="p-2 sm:p-3 text-xs font-bold uppercase text-muted-foreground dark:text-dark-muted-foreground">
                      Alertas de Caducidad ({expiryNotifications.length})
                    </h4>
                    <ul>
                      {expiryNotifications.map((notif) => (
                        <li
                          key={`exp-${notif.product_id}`}
                          className="border-b border-border dark:border-dark-border last:border-b-0"
                        >
                          <Link
                            to="/expiry-report"
                            onClick={() => handleLinkClick(`exp-${notif.product_id}`)}
                            className="block p-2 sm:p-3 hover:bg-muted/50 dark:hover:bg-dark-muted/50 active:bg-muted dark:active:bg-dark-muted transition-colors"
                          >
                            <div className="flex items-start gap-2 sm:gap-3">
                              <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 text-destructive flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-xs sm:text-sm text-foreground dark:text-dark-foreground break-words">
                                  {notif.product_name} está por caducar.
                                </p>
                                <p className="text-xs text-muted-foreground dark:text-dark-muted-foreground mt-1 break-words">
                                  Caduca el:{' '}
                                  <span className="font-semibold">
                                    {new Date(notif.soonest_expiry_date).toLocaleDateString()}
                                  </span>{' '}
                                  (
                                  {notif.days_to_expiry <= 0
                                    ? 'Caducado'
                                    : `en ${notif.days_to_expiry} días`}
                                  )
                                </p>
                              </div>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-sm text-muted-foreground p-6 sm:p-8 flex flex-col items-center gap-2 sm:gap-3">
                <BellIcon className="w-8 h-8 sm:w-10 sm:h-10 opacity-50" />
                <p className="font-medium text-sm sm:text-base">¡Todo al día!</p>
                <p className="text-xs sm:text-sm">No tienes notificaciones nuevas.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
