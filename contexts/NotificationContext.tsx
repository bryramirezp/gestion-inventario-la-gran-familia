
import React, { createContext, useState, useEffect, useCallback, useContext, ReactNode, useMemo } from 'react';
import { kitchenApi, productApi, stockLotApi } from '../services/api';
import { useAuth } from './AuthContext';
import { useUserProfile } from '../hooks/useUserProfile';
import { KitchenRequestNotification } from '../types';

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
  kitchenRequestNotifications: KitchenRequestNotification[];
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
  const [allKitchenRequestNotifications, setAllKitchenRequestNotifications] = useState<KitchenRequestNotification[]>([]);
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
        setAllKitchenRequestNotifications([]);
        return;
    }
    try {
      setLoading(true);

      const allowedRolesForStockAlerts = ['Administrator', 'Warehouse Manager', 'Nutritionist'];
      const allowedRolesForKitchenAlerts = ['Administrator', 'Warehouse Manager', 'Kitchen Staff', 'Nutritionist'];

      let productsPromise = Promise.resolve([]);
      let stockLotsPromise = Promise.resolve([]);
      if (allowedRolesForStockAlerts.includes(userProfile.role_name)) {
        const token = getToken();
        if (token) {
          productsPromise = productApi.getAll(token);
          stockLotsPromise = stockLotApi.getAll(token);
        }
      }

      let kitchenPromise = Promise.resolve([]);
      if (allowedRolesForKitchenAlerts.includes(userProfile.role_name)) {
        const token = getToken();
        if (token) {
          kitchenPromise = kitchenApi.getTransactions(token);
        }
      }

      const [allProducts, allStockLots, kitchenTransactions] = await Promise.all([
          productsPromise,
          stockLotsPromise,
          kitchenPromise
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
            const totalStock = productLots.reduce((sum, lot) => sum + lot.current_quantity, 0);

            if (totalStock < p.low_stock_threshold) {
                lowStockItems.push({ product_id: p.product_id, product_name: p.product_name, total_stock: totalStock, low_stock_threshold: p.low_stock_threshold });
            }

            const soonestExpiry = productLots.filter(l => l.expiry_date).map(l => new Date(l.expiry_date!)).sort((a, b) => a.getTime() - b.getTime())[0];
            
            if (soonestExpiry) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const daysToExpiry = Math.ceil((soonestExpiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                
                if (daysToExpiry <= 30) {
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

      // --- KITCHEN REQUEST NOTIFICATIONS ---
      let kitchenNotifications: KitchenRequestNotification[] = [];
      if (['Administrator', 'Warehouse Manager'].includes(userProfile.role_name)) {
        kitchenNotifications = kitchenTransactions.filter(t => t.status === 'Pending').map(t => ({ transaction_id: t.transaction_id, requester_name: t.requester_name, status: t.status }));
      } else if (userProfile.role_name === 'Kitchen Staff') {
          kitchenNotifications = kitchenTransactions.filter(t => t.requester_id === userProfile.user_id && (t.status === 'Approved' || t.status === 'Rejected')).map(t => ({ transaction_id: t.transaction_id, requester_name: 'Your', status: t.status }));
      } else if (userProfile.role_name === 'Nutritionist') {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          kitchenNotifications = kitchenTransactions.filter(t => t.status === 'Completed' && new Date(t.transaction_date) > yesterday).map(t => ({ transaction_id: t.transaction_id, requester_name: 'Kitchen', status: t.status }));
      }
      setAllKitchenRequestNotifications(kitchenNotifications);

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
      setAllKitchenRequestNotifications([]);
    }
  }, [user, userProfile, refreshNotifications]);

  const lowStockNotifications = useMemo(() => allLowStockNotifications.filter(n => !readIds.has(`low-${n.product_id}`)), [allLowStockNotifications, readIds]);
  const expiryNotifications = useMemo(() => allExpiryNotifications.filter(n => !readIds.has(`exp-${n.product_id}`)), [allExpiryNotifications, readIds]);
  const kitchenRequestNotifications = useMemo(() => allKitchenRequestNotifications.filter(n => !readIds.has(`kitchen-${n.transaction_id}-${n.status}`)), [allKitchenRequestNotifications, readIds]);

  const unreadCount = useMemo(() => lowStockNotifications.length + expiryNotifications.length + kitchenRequestNotifications.length, [lowStockNotifications, expiryNotifications, kitchenRequestNotifications]);

  return (
    <NotificationContext.Provider value={{ lowStockNotifications, expiryNotifications, kitchenRequestNotifications, refreshNotifications, loading, markAsRead, unreadCount }}>
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
