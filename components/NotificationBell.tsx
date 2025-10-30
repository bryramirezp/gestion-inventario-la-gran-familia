import React, { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { BellIcon, ChefHatIcon, ExclamationTriangleIcon } from './icons/Icons';
import { Button } from './Button';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../hooks/useUserProfile';

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const { data: userProfile } = useUserProfile();
  const {
    lowStockNotifications,
    expiryNotifications,
    kitchenRequestNotifications,
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

  const statusMap = {
    Approved: 'Aprobada',
    Rejected: 'Rechazada',
  } as const;

  const getKitchenNotificationMessage = (notif: (typeof kitchenRequestNotifications)[0]) => {
    switch (userProfile?.role_name) {
      case 'Consultor':
        return `La solicitud de cocina #${notif.transaction_id} fue completada.`;
      case 'Administrador':
      case 'Operador':
        return `${notif.requester_name} ha enviado una nueva solicitud (#${notif.transaction_id}).`;
      default:
        return `Actualización en la solicitud #${notif.transaction_id}.`;
    }
  };

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
        <div className="absolute top-full mt-2 right-0 w-80 bg-card rounded-lg shadow-medium z-20 border border-border dark:border-dark-border animate-slide-up">
          <div className="p-3 font-semibold border-b border-border text-foreground dark:text-dark-foreground">
            Notificaciones ({unreadCount})
          </div>
          <div className="max-h-96 overflow-y-auto">
            {unreadCount > 0 ? (
              <>
                {kitchenRequestNotifications.length > 0 && (
                  <div>
                    <h4 className="p-3 text-xs font-bold uppercase text-muted-foreground dark:text-dark-muted-foreground">
                      Solicitudes de Cocina ({kitchenRequestNotifications.length})
                    </h4>
                    <ul>
                      {kitchenRequestNotifications.map((notif) => (
                        <li
                          key={`kitchen-${notif.transaction_id}-${notif.status}`}
                          className="border-b border-border dark:border-dark-border last:border-b-0"
                        >
                          <Link
                            to="/kitchen"
                            onClick={() =>
                              handleLinkClick(`kitchen-${notif.transaction_id}-${notif.status}`)
                            }
                            className="block p-3 hover:bg-muted/50 dark:hover:bg-dark-muted/50"
                          >
                            <div className="flex items-start gap-3">
                              <ChefHatIcon className="w-5 h-5 mt-0.5 text-primary" />
                              <div>
                                <p className="font-medium text-sm text-foreground dark:text-dark-foreground">
                                  {getKitchenNotificationMessage(notif)}
                                </p>
                                <p className="text-xs text-muted-foreground dark:text-dark-muted-foreground">
                                  Haz clic para ver
                                </p>
                              </div>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {lowStockNotifications.length > 0 && (
                  <div>
                    <h4 className="p-3 text-xs font-bold uppercase text-muted-foreground dark:text-dark-muted-foreground">
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
                            className="block p-3 hover:bg-muted/50 dark:hover:bg-dark-muted/50"
                          >
                            <div className="flex items-start gap-3">
                              <ExclamationTriangleIcon className="w-5 h-5 mt-0.5 text-warning" />
                              <div>
                                <p className="font-medium text-sm text-foreground dark:text-dark-foreground">
                                  {notif.product_name} tiene stock bajo.
                                </p>
                                <p className="text-xs text-muted-foreground dark:text-dark-muted-foreground">
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
                    <h4 className="p-3 text-xs font-bold uppercase text-muted-foreground dark:text-dark-muted-foreground">
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
                            className="block p-3 hover:bg-muted/50 dark:hover:bg-dark-muted/50"
                          >
                            <div className="flex items-start gap-3">
                              <ExclamationTriangleIcon className="w-5 h-5 mt-0.5 text-destructive" />
                              <div>
                                <p className="font-medium text-sm text-foreground dark:text-dark-foreground">
                                  {notif.product_name} está por caducar.
                                </p>
                                <p className="text-xs text-muted-foreground dark:text-dark-muted-foreground">
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
              <div className="text-center text-sm text-muted-foreground p-8 flex flex-col items-center gap-3">
                <BellIcon className="w-10 h-10 opacity-50" />
                <p className="font-medium">¡Todo al día!</p>
                <p className="text-xs">No tienes notificaciones nuevas.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
