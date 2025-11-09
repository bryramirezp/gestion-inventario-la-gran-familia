
import React, { createContext, useState, useEffect, useCallback, useContext, ReactNode, useMemo } from 'react';
import { productApi, stockLotApi } from '@/data/api';
import { useAuth } from './AuthProvider';
import { useUserProfile } from '@/infrastructure/hooks/useUserProfile';
import { ROLE_PERMISSIONS, APP_CONSTANTS } from '@/shared/constants';

export interface LowStockNotification {
  product_id: number;
  product_name: string;
  total_stock: number;
  low_stock_threshold: number;
}

export interface ExpiryNotification {
  product_id: number;
  product_name: string;
  soonest_expiry_date: string;
  days_to_expiry: number;
}

interface NotificationContextType {
  lowStockNotifications: LowStockNotification[];
  expiryNotifications: ExpiryNotification[];
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => void;
  unreadCount: number;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, getToken } = useAuth();
  const { data: userProfile } = useUserProfile();
  const [allLowStockNotifications, setAllLowStockNotifications] = useState<LowStockNotification[]>([]);
  const [allExpiryNotifications, setAllExpiryNotifications] = useState<ExpiryNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
        const item = localStorage.getItem('inventory-read-notifications');
        return new Set(item ? JSON.parse(item) : []);
    } catch (error) {
        console.error("Failed to parse read notifications from localStorage", error);
        return new Set();
    }
  });

  const markAsRead = useCallback((notificationId: string) => {
    setReadIds(prevIds => {
        const newIds = new Set(prevIds);
        newIds.add(notificationId);
        try {
            localStorage.setItem('inventory-read-notifications', JSON.stringify(Array.from(newIds)));
        } catch (error) {
            console.error("Failed to save read notifications to localStorage", error);
        }
        return newIds;
    });
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!user || !userProfile) {
        setAllLowStockNotifications([]);
        setAllExpiryNotifications([]);
        return;
    }
    try {
      setLoading(true);

      const allowedRolesForStockAlerts = ROLE_PERMISSIONS.STOCK_ALERTS;

      let productsPromise = Promise.resolve([]);
      let stockLotsPromise = Promise.resolve([]);
      if (allowedRolesForStockAlerts.includes(userProfile.role_name)) {
        const token = getToken();
        if (token) {
          productsPromise = productApi.getAll(token);
          stockLotsPromise = stockLotApi.getAll(token);
        }
      }

      const [allProducts, allStockLots] = await Promise.all([
          productsPromise,
          stockLotsPromise
      ]);

      // --- STOCK & EXPIRY NOTIFICATIONS ---
      if (allowedRolesForStockAlerts.includes(userProfile.role_name)) {
        const stockLotsByProduct = allStockLots.reduce((acc, lot) => {
            if (!acc[lot.product_id]) {
                acc[lot.product_id] = [];
            }
            acc[lot.product_id].push(lot);
            return acc;
        }, {} as Record<number, any[]>);

        const lowStockItems: LowStockNotification[] = [];
        const expiryItems: ExpiryNotification[] = [];

        for (const p of allProducts) {
            const productLots = stockLotsByProduct[p.product_id] || [];
            const totalStock = productLots.reduce((sum, lot) => sum + Number(lot.current_quantity), 0);

            if (totalStock < p.low_stock_threshold) {
                lowStockItems.push({ product_id: p.product_id, product_name: p.product_name, total_stock: totalStock, low_stock_threshold: p.low_stock_threshold });
            }

            const soonestExpiry = productLots.filter(l => l.expiry_date).map(l => new Date(l.expiry_date!)).sort((a, b) => a.getTime() - b.getTime())[0];
            
            if (soonestExpiry) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const daysToExpiry = Math.ceil((soonestExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                
                if (daysToExpiry <= APP_CONSTANTS.EXPIRY_ALERT_DAYS) {
                    expiryItems.push({ product_id: p.product_id, product_name: p.product_name, soonest_expiry_date: soonestExpiry.toISOString().split('T')[0], days_to_expiry: daysToExpiry });
                }
            }
        }
        
        setAllLowStockNotifications(lowStockItems);
        setAllExpiryNotifications(expiryItems);
      } else {
        setAllLowStockNotifications([]);
        setAllExpiryNotifications([]);
      }

    } catch (error) {
      console.error("Failed to refresh notifications", error);
    } finally {
      setLoading(false);
    }
  }, [user, userProfile, getToken]);

  useEffect(() => {
    if(user && userProfile){
      refreshNotifications();
    } else {
      setLoading(false);
      setAllLowStockNotifications([]);
      setAllExpiryNotifications([]);
    }
  }, [user, userProfile, refreshNotifications]);

  const lowStockNotifications = useMemo(() => allLowStockNotifications.filter(n => !readIds.has(`low-${n.product_id}`)), [allLowStockNotifications, readIds]);
  const expiryNotifications = useMemo(() => allExpiryNotifications.filter(n => !readIds.has(`exp-${n.product_id}`)), [allExpiryNotifications, readIds]);

  const unreadCount = useMemo(() => lowStockNotifications.length + expiryNotifications.length, [lowStockNotifications, expiryNotifications]);

  return (
    <NotificationContext.Provider value={{ lowStockNotifications, expiryNotifications, refreshNotifications, loading, markAsRead, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export { useNotifications };
