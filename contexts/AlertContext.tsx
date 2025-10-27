import React, { createContext, useState, useCallback, useContext, ReactNode } from 'react';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface Alert {
  id: number;
  message: string;
  type: AlertType;
}

interface AlertContextType {
  alerts: Alert[];
  addAlert: (message: string, type: AlertType) => void;
  removeAlert: (id: number) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const removeAlert = useCallback((id: number) => {
    setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== id));
  }, []);

  const addAlert = useCallback((message: string, type: AlertType) => {
    const id = new Date().getTime();
    setAlerts(prevAlerts => [...prevAlerts, { id, message, type }]);
    
    setTimeout(() => {
      removeAlert(id);
    }, 5000); // Auto-dismiss after 5 seconds
  }, [removeAlert]);

  return (
    <AlertContext.Provider value={{ alerts, addAlert, removeAlert }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
};